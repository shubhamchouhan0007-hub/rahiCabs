package com.rahicabs.dto;

import com.rahicabs.entity.ServiceType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerBookingRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;

    @NotNull(message = "Pickup latitude is required")
    private Double pickupLatitude;

    @NotNull(message = "Pickup longitude is required")
    private Double pickupLongitude;

    @NotBlank(message = "Drop location is required")
    private String dropLocation;

    @NotNull(message = "Drop latitude is required")
    private Double dropLatitude;

    @NotNull(message = "Drop longitude is required")
    private Double dropLongitude;

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    private LocalDateTime scheduledAt;

    @NotNull(message = "Distance is required")
    private Double distance;

    @NotNull(message = "Duration is required")
    private Integer duration;

    @NotNull(message = "Total fare is required")
    private Double totalFare;

    private String notes;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits")
    private String otp;
}
