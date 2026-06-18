package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object used when an STO admin initiates the repair process.
 * Contains instructions or estimated completion time to be sent to the customer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartRepairRequest {

    /** Message or estimated completion time for the vehicle owner. */
    private String message;
}