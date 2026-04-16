package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_requests")
@Data
public class ServiceRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "sto_id")
    private User sto; // СТО, до якого звернулися

    private String description;
    private String status; // наприклад: OPEN, IN_PROGRESS, COMPLETED, REJECTED
    private LocalDateTime createdAt;
    private String blockchainTxHash; // Хеш запису в блокчейні
}