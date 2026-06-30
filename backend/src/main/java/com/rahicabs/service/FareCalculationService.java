package com.rahicabs.service;

import com.rahicabs.dto.FareCalculationRequest;
import com.rahicabs.dto.FareCalculationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class FareCalculationService {

    private final AppSettingService settings;

    @Value("${app.google.maps.key:}")
    private String googleMapsKey;

    public FareCalculationResponse calculateFare(FareCalculationRequest request) {
        double farePerKm   = settings.getDouble("fare.per_km",      11.0);
        double advancePct  = settings.getDouble("fare.advance_pct",  15.0);
        double minimumFare = settings.getDouble("fare.minimum",     150.0);

        double distance;
        int    duration;

        if (isGoogleConfigured()) {
            double[] result = callDistanceMatrix(
                request.getPickupLatitude(),  request.getPickupLongitude(),
                request.getDropLatitude(),    request.getDropLongitude());
            distance = result[0];
            duration = (int) result[1];
        } else {
            log.warn("Google Maps key not configured — using Haversine estimate (set app.google.maps.key for road-accurate distances)");
            distance = haversineKm(
                request.getPickupLatitude(),  request.getPickupLongitude(),
                request.getDropLatitude(),    request.getDropLongitude());
            duration = (int) Math.ceil((distance / 40.0) * 60);
        }

        // Per-category pricing
        String serviceType = request.getServiceType() == null ? "" : request.getServiceType();
        double totalFare;
        switch (serviceType) {
            case "ROUND_TRIP":
                distance = distance * 2;   // there & back
                duration = duration * 2;
                totalFare = slabFare(distance) + SERVICE_GST;
                break;
            case "ONE_WAY":
                totalFare = slabFare(distance) + SERVICE_GST;
                break;
            case "AIRPORT_TRANSFER":
                totalFare = airportFare(distance);
                break;
            case "OUTSTATION": {
                boolean suv  = "SUV".equalsIgnoreCase(request.getVehicleType());
                double  base = suv ? 2000.0 : 1500.0;   // per 24 hr
                double  perKm = suv ? 14.0  : 11.0;
                totalFare = base + perKm * distance;
                break;
            }
            default:   // CITY_TAXI, HOURLY_RENTAL, AIRPORT_TRANSFER — flat rate (to be finalised)
                totalFare = Math.max(minimumFare, distance * farePerKm);
        }

        double advanceAmount = totalFare * (advancePct / 100.0);
        double remaining     = totalFare - advanceAmount;

        return FareCalculationResponse.builder()
                .distance(Math.round(distance * 100.0) / 100.0)
                .duration(duration)
                .totalFare(Math.round(totalFare * 100.0) / 100.0)
                .advanceAmount(Math.round(advanceAmount * 100.0) / 100.0)
                .remainingAmount(Math.round(remaining * 100.0) / 100.0)
                .build();
    }

    /** Fixed service charge + GST added to one-way and round-trip fares. */
    private static final double SERVICE_GST = 148.0;

    /** Slab pricing: ₹12/km up to 100 km, ₹11/km for 100–200 km, ₹10/km beyond 200 km. */
    private double slabFare(double km) {
        if (km <= 100) return km * 12.0;
        if (km <= 200) return 100 * 12.0 + (km - 100) * 11.0;
        return 100 * 12.0 + 100 * 11.0 + (km - 200) * 10.0;
    }

    /**
     * Airport transfer slabs: ₹33/km ≤30, ₹30/km 30–50, ₹27/km 50–100,
     * ₹24/km 100–150, ₹22/km 150–200, ₹20/km beyond 200. Charged on each band.
     */
    private double airportFare(double km) {
        double[] edges = {30, 50, 100, 150, 200};      // band upper limits
        double[] rates = {33, 30, 27, 24, 22, 20};     // rate within each band
        double fare = 0, prev = 0;
        for (int i = 0; i < edges.length; i++) {
            if (km <= edges[i]) return fare + (km - prev) * rates[i];
            fare += (edges[i] - prev) * rates[i];
            prev = edges[i];
        }
        return fare + (km - prev) * rates[rates.length - 1]; // 200+ km
    }

    private boolean isGoogleConfigured() {
        return googleMapsKey != null && !googleMapsKey.isBlank() && !googleMapsKey.startsWith("YOUR");
    }

    private double[] callDistanceMatrix(double lat1, double lon1, double lat2, double lon2) {
        try {
            RestTemplate rest = new RestTemplate();
            String url = String.format(
                "https://maps.googleapis.com/maps/api/distancematrix/json" +
                "?origins=%f,%f&destinations=%f,%f&mode=driving&key=%s",
                lat1, lon1, lat2, lon2, googleMapsKey);

            String raw = rest.getForObject(url, String.class);
            JSONObject json = new JSONObject(raw);

            if (!"OK".equals(json.getString("status"))) {
                log.warn("Distance Matrix API status: {}", json.getString("status"));
                return haversineResult(lat1, lon1, lat2, lon2);
            }

            JSONObject element = json.getJSONArray("rows")
                    .getJSONObject(0)
                    .getJSONArray("elements")
                    .getJSONObject(0);

            if (!"OK".equals(element.getString("status"))) {
                log.warn("Distance Matrix element status: {}", element.getString("status"));
                return haversineResult(lat1, lon1, lat2, lon2);
            }

            double distanceKm = element.getJSONObject("distance").getInt("value") / 1000.0;
            int    durationMin = element.getJSONObject("duration").getInt("value") / 60;
            log.info("Google Distance Matrix: {} km, {} min", distanceKm, durationMin);
            return new double[]{ distanceKm, durationMin };

        } catch (Exception e) {
            log.error("Distance Matrix API call failed: {}", e.getMessage());
            return haversineResult(lat1, lon1, lat2, lon2);
        }
    }

    private double[] haversineResult(double lat1, double lon1, double lat2, double lon2) {
        double dist = haversineKm(lat1, lon1, lat2, lon2);
        return new double[]{ dist, (int) Math.ceil((dist / 40.0) * 60) };
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
