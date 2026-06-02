package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.IntegrityCheckResponse;
import com.vehicle.service.vehicleserviceapi.service.BlockchainAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller responsible for blockchain auditing and data integrity verification.
 * Provides endpoints to verify individual service requests against the blockchain
 * and to synchronize/recover missing records from the decentralized ledger.
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final BlockchainAuditService auditService;

    // ============================================================================
    // AUDIT & VERIFICATION ENDPOINTS
    // ============================================================================

    /**
     * Verifies the integrity of a specific service request by comparing local DB records
     * with the immutable data stored on the blockchain smart contract.
     * Accessible to all authenticated users (Customer, Manager, Admin) as reading is free.
     *
     * @param requestId The local database ID of the service request.
     * @return ResponseEntity containing the boolean result and details of the integrity check.
     */
    @GetMapping("/verify-job/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IntegrityCheckResponse> verifyJobIntegrity(@PathVariable Long requestId) {
        log.info("Audit Action: Verifying blockchain integrity for Request ID: {}", requestId);

        try {
            IntegrityCheckResponse response = auditService.verifyJobIntegrity(requestId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to verify job integrity for Request ID: {}", requestId, e);

            // Return a graceful failure response instead of dropping the request
            return ResponseEntity.internalServerError().body(
                    IntegrityCheckResponse.builder()
                            .valid(false)
                            .message("Audit execution failed: " + e.getMessage())
                            .build()
            );
        }
    }

    // ============================================================================
    // SYNCHRONIZATION & RECOVERY ENDPOINTS
    // ============================================================================

    /**
     * Performs a bulk scan of the blockchain smart contract for existing repair jobs
     * and restores any missing or tampered records in the local database.
     * Strictly restricted to STO Managers and Administrators.
     *
     * @return ResponseEntity with a textual summary of the synchronization process.
     */
    @PostMapping("/sync-deleted")
    @PreAuthorize("hasAnyRole('STO', 'ADMIN')")
    public ResponseEntity<String> syncDeletedRequests() {
        log.info("Audit Action: Initiating full blockchain synchronization for missing records.");

        try {
            List<Long> recoveredJobIds = auditService.syncDeletedRequests();

            if (recoveredJobIds.isEmpty()) {
                log.info("Synchronization complete. No discrepancies found.");
                return ResponseEntity.ok("Synchronization complete. No discrepancies found (all data is intact).");
            }

            log.info("Successfully recovered Job IDs from blockchain: {}", recoveredJobIds);
            return ResponseEntity.ok("Successfully recovered from blockchain and added to DB. Job IDs: " + recoveredJobIds);

        } catch (Exception e) {
            log.error("Blockchain synchronization failed due to an internal error", e);
            return ResponseEntity.internalServerError().body("Synchronization failed: " + e.getMessage());
        }
    }
}