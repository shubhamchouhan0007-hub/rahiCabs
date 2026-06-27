package com.rahicabs.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FareCalculationRequest {
    @NotNull(message = "Pickup latitude is required")
    private Double pickupLatitude;

    @NotNull(message = "Pickup longitude is required")
    private Double pickupLongitude;

    @NotNull(message = "Drop latitude is required")
    private Double dropLatitude;

    @NotNull(message = "Drop longitude is required")
    private Double dropLongitude;

    private String serviceType; // optional — used to double distance for ROUND_TRIP
}
