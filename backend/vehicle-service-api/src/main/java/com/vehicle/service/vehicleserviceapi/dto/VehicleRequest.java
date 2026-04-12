package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class VehicleRequest {
    private String vin;
    private String brand;
    private String model;
    private String ownerName;
}