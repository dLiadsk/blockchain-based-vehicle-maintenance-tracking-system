package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing a vehicle service request.
 * Tracks the current state of a repair job and maintains a link to its status history.
 */
@Entity
@Table(name = "service_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "sto_profile_id", nullable = false)
    private StoProfile stoProfile;

    /**
     * One-to-Many relationship to track the chronological history of status changes.
     * Use 'mappedBy' to point to the field in the StatusHistory entity.
     */
    @OneToMany(mappedBy = "serviceRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("changedAt ASC")
    private List<StatusHistory> statusHistory;
    /**
     * Mileage at the time of the request and a list of required services.
     */
    @Column(name = "mileage")
    private Long mileage;

    /**
     * List of work types requested for this specific service.
     * Example: ["Oil Change", "Brake Inspection", "AC Recharge"].
     */
    @ElementCollection
    @CollectionTable(name = "service_request_work_types", joinColumns = @JoinColumn(name = "service_request_id"))
    @Column(name = "work_type")
    private List<String> workTypes;

    // --- Service Details ---

    private String description;
    private String mechanic;

    /**
     * Current lifecycle status. This is the "Source of Truth" for the present moment.
     */
    private String status;

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String arrivalInstructions;

    private Long totalAmount;
    private Long depositAmount;

    // --- Blockchain Metadata ---

    private String blockchainTxHash;
    private Long blockchainJobId;

    // --- Document Audit Trail (SHA-256 Hashes) ---

    private String pdfHash;
    private String inspectionPdfHash;
    private String paymentReceiptPdfHash;
    private String workReportPdfHash;
    private String finalReceiptPdfHash;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}