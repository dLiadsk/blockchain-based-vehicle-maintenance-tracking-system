package com.vehicle.service.vehicleserviceapi.dto;

import com.vehicle.service.vehicleserviceapi.model.User;
import lombok.Data;

@Data
public class VehicleRequest {
    private String vin;
    private String brand;
    private String model;
}