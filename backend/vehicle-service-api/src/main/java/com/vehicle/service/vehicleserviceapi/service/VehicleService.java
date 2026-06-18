package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.model.ServiceRequest;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.repository.ServiceRequestRepository;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing vehicle-related operations and blockchain registration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final BlockchainService blockchainService;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ServiceRequestRepository requestRepository;

    /**
     * Registers a new vehicle or claims a vehicle recovered from the blockchain.
     * Prevents duplicate registrations and links recovered service history to the new owner.
     *
     * @param request    The vehicle registration payload.
     * @param ownerEmail The email of the user registering the vehicle.
     * @return The registered or claimed Vehicle entity.
     */
    @Transactional
    public Vehicle registerNewVehicle(VehicleRequest request, String ownerEmail) throws Exception {
        log.info("Processing vehicle registration for user: {}", ownerEmail);

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerEmail));

        Optional<Vehicle> existingOpt = vehicleRepository.findByVin(request.getVin());

        if (existingOpt.isPresent()) {
            Vehicle existingVehicle = existingOpt.get();

            // Check if the vehicle is a recovered phantom record (owner is null)
            if (existingVehicle.getOwner() == null) {
                log.info("Claiming recovered vehicle with VIN {} for user {}", request.getVin(), ownerEmail);

                // 1. Update placeholder details with actual user input
                existingVehicle.setNumber(request.getNumber());
                existingVehicle.setBrand(request.getBrand());
                existingVehicle.setModel(request.getModel());
                existingVehicle.setYear(request.getYear());
                existingVehicle.setMileage(request.getMileage());
                existingVehicle.setVehicleType(request.getVehicleType());
                existingVehicle.setOwner(currentUser);

                Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

                // 2. Link orphaned service requests to the newly assigned owner
                List<ServiceRequest> orphanRequests = requestRepository.findAllByVehicleOrderByCreatedAtDesc(updatedVehicle);
                if (!orphanRequests.isEmpty()) {
                    orphanRequests.forEach(req -> req.setCustomer(currentUser));
                    requestRepository.saveAll(orphanRequests);
                    log.info("Linked {} recovered requests to user {}", orphanRequests.size(), ownerEmail);
                }

                // Note: Skipping blockchainService.registerVehicle() as the record already exists on-chain
                return updatedVehicle;
            } else {
                log.warn("Attempted to register an already owned vehicle with VIN {}", request.getVin());
                throw new IllegalArgumentException("A vehicle with this VIN is already registered.");
            }
        }

        // Standard registration flow for a completely new vehicle
        log.info("Registering completely new vehicle with VIN {}", request.getVin());

        // 1. Register on the blockchain
        String passportHash = "PASSPORT_HASH_" + request.getVin(); // Placeholder for actual document hashing
        String txHash = blockchainService.registerVehicle(request.getVin(), passportHash);

        // 2. Persist in the local database
        Vehicle newVehicle = Vehicle.builder()
                .vin(request.getVin())
                .number(request.getNumber())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .owner(currentUser)
                .mileage(request.getMileage())
                .vehicleType(request.getVehicleType())
                .blockchainTxHash(txHash)
                .build();

        return vehicleRepository.save(newVehicle);
    }

    /**
     * Retrieves all vehicles belonging to the specified user.
     */
    public List<Vehicle> getVehiclesByOwner(String ownerEmail) {
        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return vehicleRepository.findAllByOwnerId(user.getId());
    }

    /**
     * Retrieves full vehicle specifications and technical data by VIN.
     *
     * @param vin The unique vehicle identification number.
     * @return Vehicle entity containing current specifications and owner information.
     */
    @Transactional(readOnly = true)
    public Vehicle getVehicleByVin(String vin) {
        return vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with VIN: " + vin));
    }

    /**
     * Retrieves the complete lifecycle history of a vehicle across all service stations.
     *
     * @param vin The unique vehicle identification number.
     * @return List of all service requests associated with this vehicle.
     */
    @Transactional(readOnly = true)
    public List<ServiceRequest> getVehicleServiceHistory(String vin) {
        Vehicle vehicle = getVehicleByVin(vin);
        return requestRepository.findAllByVehicleOrderByCreatedAtDesc(vehicle);
    }
}