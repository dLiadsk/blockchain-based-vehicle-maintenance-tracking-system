package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for vehicle management.
 * Provides endpoints for users to register and view their vehicles.
 */
@Slf4j
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * Registers a vehicle to the currently authenticated user.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Vehicle> registerVehicle(@RequestBody VehicleRequest request, Principal principal) {
        log.debug("REST request to register vehicle: {}", request.getVin());
        try {
            Vehicle vehicle = vehicleService.registerNewVehicle(request, principal.getName());
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            log.error("Failed to register vehicle: ", e);
            // In professional apps, we would use an ExceptionHandler for this.
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Returns a list of vehicles owned by the current user.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Vehicle>> getMyVehicles(Principal principal) {
        log.debug("REST request to fetch my vehicles: {}", principal.getName());
        List<Vehicle> vehicles = vehicleService.getVehiclesByOwner(principal.getName());
        return ResponseEntity.ok(vehicles);
    }
}