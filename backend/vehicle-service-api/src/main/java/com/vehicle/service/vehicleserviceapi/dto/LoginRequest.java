package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO for user login credentials.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String email;
    private String password;
}