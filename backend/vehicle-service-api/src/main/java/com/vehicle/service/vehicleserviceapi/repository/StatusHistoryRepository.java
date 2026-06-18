package com.vehicle.service.vehicleserviceapi.repository;

import com.vehicle.service.vehicleserviceapi.model.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for StatusHistory entities.
 * Facilitates the storage and retrieval of chronological status updates for audit trails.
 */
@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {

    /**
     * Finds the full history of status changes for a specific service request.
     * Results are ordered by the change timestamp in ascending order.
     * * @param serviceRequestId The ID of the parent ServiceRequest.
     * @return A list of StatusHistory records representing the audit trail.
     */
    List<StatusHistory> findAllByServiceRequestIdOrderByChangedAtAsc(Long serviceRequestId);
}