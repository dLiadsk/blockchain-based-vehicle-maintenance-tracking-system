package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for capturing the reason when cancelling a service request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelRequestDto {

    /** The justification or reason provided by the user or admin for the cancellation. */
    private String reason;
}