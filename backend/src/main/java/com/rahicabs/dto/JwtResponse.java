package com.rahicabs.dto;

import com.rahicabs.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;
    private Role role;

    public JwtResponse(String token, Long id, String name, String email, Role role) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}
