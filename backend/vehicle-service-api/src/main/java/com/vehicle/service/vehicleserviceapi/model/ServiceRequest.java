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
    @JoinColumn(name = "sto_profile_id", nullable = false)
    private StoProfile stoProfile;

    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String blockchainTxHash;
    private Long blockchainJobId;
    private String pdfHash;
    @Column(columnDefinition = "TEXT")
    private String arrivalInstructions;
    private Long totalAmount;      // Загальна вартість ремонту
    private Long depositAmount;    // Сума обов'язкового депозиту
    private String inspectionPdfHash; // Хеш другого PDF (Акт огляду)
    private String paymentReceiptPdfHash; // Хеш чека про оплату депозиту
    private String workReportPdfHash;
}