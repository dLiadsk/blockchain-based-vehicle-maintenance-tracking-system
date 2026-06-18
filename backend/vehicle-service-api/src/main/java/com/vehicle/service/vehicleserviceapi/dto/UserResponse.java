package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * Detailed user information returned after successful authentication or registration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private StoProfileResponse stoProfile;
}