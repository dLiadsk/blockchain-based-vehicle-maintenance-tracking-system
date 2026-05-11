package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO for vehicle registration requests.
 * Used when a driver adds a new vehicle to their account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {
    /** 17-character Vehicle Identification Number. */
    private String vin;
    private String brand;
    private String model;
    private Short year;
}