package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * Wrapper for the authentication token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
}