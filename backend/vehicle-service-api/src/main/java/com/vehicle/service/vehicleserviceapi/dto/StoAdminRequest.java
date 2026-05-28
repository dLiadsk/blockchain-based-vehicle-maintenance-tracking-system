package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO for registering a new administrator for a specific service station.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoAdminRequest {
    private String email;
    private String password;
    /** The ID of the STO profile this admin will manage. */
    private Long stoId;
    private String firstName;
    private String lastName;
    private String phoneNumber;
}