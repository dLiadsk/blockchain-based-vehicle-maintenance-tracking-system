package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private StoProfileResponse stoProfile;
}