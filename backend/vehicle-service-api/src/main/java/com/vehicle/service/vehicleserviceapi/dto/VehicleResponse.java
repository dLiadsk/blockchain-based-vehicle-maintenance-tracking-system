package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing vehicle details sent to the client.
 * Contains public-facing information about a registered vehicle.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    /** The unique 17-character Vehicle Identification Number (VIN). */
    private String vin;

    /** The state-issued license plate number of the vehicle. */
    private String number;

    /** The manufacturer or brand of the vehicle (e.g., Toyota, BMW). */
    private String brand;

    /** The specific model of the vehicle (e.g., Camry, X5). */
    private String model;

    /** The manufacturing year of the vehicle. */
    private Short year;

    /** The current recorded mileage (odometer reading) in kilometers. */
    private Long mileage;

    /** The classification of the vehicle (e.g., Sedan, SUV, Truck). */
    private String vehicleType;
}