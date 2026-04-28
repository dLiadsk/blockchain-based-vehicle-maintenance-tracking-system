package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class StoAdminRequest {
    private String email;
    private String password;
    private Long stoId;
}