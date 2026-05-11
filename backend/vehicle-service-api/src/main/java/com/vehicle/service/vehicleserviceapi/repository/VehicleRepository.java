package com.vehicle.service.vehicleserviceapi.repository;

import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Vehicle entities.
 * Handles the storage of vehicle technical data and blockchain cross-references (VIN).
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /**
     * Finds a vehicle by its unique Vehicle Identification Number (VIN).
     *
     * @param vin The unique 17-character VIN.
     * @return An Optional containing the vehicle if found.
     */
    Optional<Vehicle> findByVin(String vin);

    /**
     * Retrieves all vehicles registered under a specific owner.
     *
     * @param ownerId The ID of the user who owns the vehicles.
     * @return A list of vehicles.
     */
    List<Vehicle> findAllByOwnerId(Long ownerId);
}