package com.rahicabs.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "driver_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String vehicleNumber;
    private String vehicleType;
    private String aadhaarNumber;
    private String licenseNumber;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Integer totalRides = 0;

    @Builder.Default
    private Double rating = 5.0;
}
