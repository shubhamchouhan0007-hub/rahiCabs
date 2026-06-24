package com.rahicabs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerJwtResponse {
    private String token;
    private Long customerId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private boolean isNewUser;
}
