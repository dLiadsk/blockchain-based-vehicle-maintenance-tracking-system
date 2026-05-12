package com.vehicle.service.vehicleserviceapi.repository;

import com.vehicle.service.vehicleserviceapi.model.ServiceRequest;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ServiceRequest entities.
 * Manages the persistence of vehicle repair jobs and their lifecycle states.
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    /**
     * Retrieves all service requests associated with a specific customer.
     *
     * @param customerId The ID of the user (driver).
     * @return A list of service requests.
     */
    List<ServiceRequest> findAllByCustomerId(Long customerId);

    /**
     * Retrieves all service requests assigned to a specific Service Station (STO).
     *
     * @param stoProfileId The ID of the STO profile.
     * @return A list of service requests.
     */
    List<ServiceRequest> findAllByStoProfileId(Long stoProfileId);
    /**
     * Retrieves all service requests associated with a specific vehicle,
     * ordered by their creation date in descending order.
     *
     * @param vehicle The vehicle entity to filter by.
     * @return A list of service requests forming the vehicle's maintenance history.
     */
    List<ServiceRequest> findAllByVehicleOrderByCreatedAtDesc(Vehicle vehicle);
}