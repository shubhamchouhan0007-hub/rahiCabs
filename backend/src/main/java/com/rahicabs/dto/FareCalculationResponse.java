package com.rahicabs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FareCalculationResponse {
    private Double distance; // in km
    private Integer duration; // in minutes
    private Double totalFare;
    private Double advanceAmount; // 15% of total
    private Double remainingAmount;
}
