package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO used by customers to initiate a new service request for a vehicle.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceRequest {
    /** Vehicle Identification Number (VIN). */
    private String vin;
    /** Database ID of the selected service station. */
    private Long stoId;
    /** Detailed description of the mechanical issue or required maintenance. */
    private String description;
}