package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity responsible for tracking the chronological history of status changes for a service request.
 * This provides an immutable audit trail, linking database states with blockchain transactions.
 */
@Entity
@Table(name = "service_request_status_history")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistory {

    /**
     * Unique identifier for the history record.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the parent service request.
     * Excluded from toString to prevent circular dependency issues with ServiceRequest.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id", nullable = false)
    @ToString.Exclude
    private ServiceRequest serviceRequest;

    /**
     * The specific status assigned to the request at this point in the lifecycle.
     * Examples: ACCEPTED, INSPECTED, WORK_IN_PROGRESS.
     */
    @Column(nullable = false)
    private String status;

    /**
     * Timestamp indicating when this status change occurred.
     */
    @Column(nullable = false)
    private LocalDateTime changedAt;

    /**
     * Optional hash of the blockchain transaction that verified this status update.
     * Ensures transparency and non-repudiation of the maintenance history.
     */
    private String blockchainTxHash;

    /**
     * Lifecycle hook to automatically set the timestamp before the record is saved.
     */
    @PrePersist
    protected void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}