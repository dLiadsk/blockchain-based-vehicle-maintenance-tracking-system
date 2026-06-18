package com.vehicle.service.vehicleserviceapi.repository;

import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for StoProfile entities.
 * Handles storage and retrieval of Service Station facility information.
 */
@Repository
public interface StoProfileRepository extends JpaRepository<StoProfile, Long> {
    // Standard CRUD operations provided by JpaRepository
}