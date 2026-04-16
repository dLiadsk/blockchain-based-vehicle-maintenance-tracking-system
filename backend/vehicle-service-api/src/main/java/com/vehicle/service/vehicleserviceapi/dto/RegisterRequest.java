package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String phoneNumber;
    private String password;
    private String firstName;
    private String lastName;
}