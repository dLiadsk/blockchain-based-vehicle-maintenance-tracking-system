package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    /**
     * Registers a new vehicle both in the local database and on the blockchain.
     */
    @Transactional
    public Vehicle registerNewVehicle(VehicleRequest request, String ownerEmail) throws Exception {
        log.info("Processing vehicle registration for user: {}", ownerEmail);

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerEmail));

        // 1. Register on Blockchain
        // In a real scenario, passportHash should be a real document hash.
        String passportHash = "PASSPORT_HASH_" + request.getVin();
        String txHash = blockchainService.registerVehicle(request.getVin(), passportHash);

        // 2. Save to local database
        Vehicle vehicle = Vehicle.builder()
                .vin(request.getVin())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .owner(currentUser)
                .blockchainTxHash(txHash)
                .build();

        log.info("Vehicle with VIN {} successfully registered on blockchain and DB", request.getVin());
        return vehicleRepository.save(vehicle);
    }

    /**
     * Retrieves all vehicles belonging to the specified user.
     */
    public List<Vehicle> getVehiclesByOwner(String ownerEmail) {
        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return vehicleRepository.findAllByOwnerId(user.getId());
    }
}