package com.rahicabs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SavedLocationRequest {
    @NotBlank(message = "Label is required")
    private String label;

    @NotBlank(message = "Address is required")
    private String address;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}
