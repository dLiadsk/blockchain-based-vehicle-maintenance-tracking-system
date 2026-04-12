package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String vin;

    private String brand;
    private String model;
    private String ownerName;

    // Сюди ми запишемо Transaction Hash після успішного запису в блокчейн
    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;
}