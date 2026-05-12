package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a vehicle registered in the system.
 * Stores technical details and connects the vehicle to its owner and blockchain records.
 */
@Entity
@Table(name = "vehicles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    /**
     * Unique identifier for the vehicle in the local database.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Vehicle Identification Number (VIN).
     * Must be unique and is used as a primary identifier in blockchain operations.
     */
    @Column(unique = true, nullable = false)
    private String vin;

    /**
     * License plate number of the vehicle.
     */
    private String number;

    /**
     * Vehicle manufacturer (e.g., Fiat).
     */
    private String brand;

    /**
     * Vehicle model (e.g., Linea).
     */
    private String model;

    /**
     * Manufacturing year of the vehicle.
     */
    private Short year;

    /** Current mileage of the vehicle in kilometers */
    private Long mileage;

    /** Type of vehicle (e.g., Sedan, SUV, Truck, Motorcycle) */
    private String vehicleType;

    /**
     * Owner of the vehicle, mapped to the User entity.
     */
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    /**
     * Hash of the blockchain transaction where the vehicle was registered.
     * Ensures the link between the local database and the distributed ledger.
     */
    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;
}