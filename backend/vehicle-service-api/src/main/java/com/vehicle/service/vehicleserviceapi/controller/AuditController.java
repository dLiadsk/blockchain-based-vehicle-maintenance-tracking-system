package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.IntegrityCheckResponse;
import com.vehicle.service.vehicleserviceapi.dto.JobHistoryEventDto;
import com.vehicle.service.vehicleserviceapi.service.BlockchainAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final BlockchainAuditService auditService;

    /**
     * Available for EVERYONE (Customer, Manager, Admin).
     * Since reading blockchain is free, the driver can trigger this to verify their data.
     */
    @GetMapping("/verify-job/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IntegrityCheckResponse> verifyJobIntegrity(@PathVariable Long requestId) {
        try {
            IntegrityCheckResponse response = auditService.verifyJobIntegrity(requestId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    IntegrityCheckResponse.builder()
                            .valid(false)
                            .message("Помилка виконання аудиту: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Bulk scanning and restoring of missing/deleted requests from the blockchain.
     * RESTRICTED: Only for Managers and STO Admins.
     */
    @PostMapping("/sync-deleted")
    @PreAuthorize("hasAnyRole('STO', 'ADMIN')")
    public ResponseEntity<String> syncDeletedRequests() {
        try {
            List<Long> recoveredJobIds = auditService.syncDeletedRequests();
            if (recoveredJobIds.isEmpty()) {
                return ResponseEntity.ok("Синхронізація завершена. Розбіжностей не виявлено (всі дані на місці).");
            }
            return ResponseEntity.ok("Успішно відновлено з блокчейну та додано в БД заявок з Job ID: " + recoveredJobIds);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка синхронізації: " + e.getMessage());
        }
    }
}