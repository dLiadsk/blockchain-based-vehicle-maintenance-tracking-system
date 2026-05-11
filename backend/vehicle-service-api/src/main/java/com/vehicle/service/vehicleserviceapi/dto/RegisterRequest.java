package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO for new user registration (Driver role).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String phoneNumber;
    private String password;
    private String firstName;
    private String lastName;
}