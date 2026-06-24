package com.rahicabs.service;

import com.rahicabs.dto.FareCalculationRequest;
import com.rahicabs.dto.FareCalculationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FareCalculationService {

    @Value("${app.fare.per-km:11.0}")
    private double farePerKm;

    @Value("${app.fare.advance-percentage:15.0}")
    private double advancePercentage;

    public FareCalculationResponse calculateFare(FareCalculationRequest request) {
        // Calculate distance using Haversine formula
        double distance = calculateDistance(
                request.getPickupLatitude(),
                request.getPickupLongitude(),
                request.getDropLatitude(),
                request.getDropLongitude()
        );

        // Estimate duration (assuming average speed of 40 km/h)
        int duration = (int) Math.ceil((distance / 40.0) * 60); // in minutes

        // Calculate fare
        double totalFare = distance * farePerKm;
        double advanceAmount = totalFare * (advancePercentage / 100.0);
        double remainingAmount = totalFare - advanceAmount;

        return FareCalculationResponse.builder()
                .distance(Math.round(distance * 100.0) / 100.0) // Round to 2 decimal places
                .duration(duration)
                .totalFare(Math.round(totalFare * 100.0) / 100.0)
                .advanceAmount(Math.round(advanceAmount * 100.0) / 100.0)
                .remainingAmount(Math.round(remainingAmount * 100.0) / 100.0)
                .build();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
