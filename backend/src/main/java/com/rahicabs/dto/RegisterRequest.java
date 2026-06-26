package com.rahicabs.dto;

import com.rahicabs.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6)
    private String password;

    private String phone;
    private Role role = Role.CLIENT;

    // Driver-specific fields
    private String vehicleNumber;
    private String vehicleType;
    private String aadhaarNumber;
    private String licenseNumber;
}
