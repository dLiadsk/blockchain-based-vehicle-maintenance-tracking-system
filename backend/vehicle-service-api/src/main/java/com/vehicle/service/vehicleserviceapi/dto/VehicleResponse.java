package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {
    /** 17-character Vehicle Identification Number. */
    private String vin;
    private String number;
    private String brand;
    private String model;
    private Short year;
    private Long mileage;
    private String vehicleType;
}