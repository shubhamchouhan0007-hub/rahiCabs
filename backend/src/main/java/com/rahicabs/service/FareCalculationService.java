package com.rahicabs.service;

import com.rahicabs.dto.FareCalculationRequest;
import com.rahicabs.dto.FareCalculationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FareCalculationService {

    private final AppSettingService settings;

    public FareCalculationResponse calculateFare(FareCalculationRequest request) {
        double farePerKm        = settings.getDouble("fare.per_km", 11.0);
        double advancePct       = settings.getDouble("fare.advance_pct", 15.0);
        double minimumFare      = settings.getDouble("fare.minimum", 150.0);

        double distance = calculateDistance(
                request.getPickupLatitude(),  request.getPickupLongitude(),
                request.getDropLatitude(),    request.getDropLongitude());

        int duration = (int) Math.ceil((distance / 40.0) * 60);

        double totalFare     = Math.max(minimumFare, distance * farePerKm);
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

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
