package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.service.PdfService;
import com.vehicle.service.vehicleserviceapi.service.ServiceRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST Controller for managing the lifecycle of vehicle service requests.
 * Handles creation, status updates, document retrieval, and payment processing.
 */
@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final PdfService pdfService;

    // ============================================================================
    // CREATION & RETRIEVAL ENDPOINTS
    // ============================================================================

    /**
     * Creates a new service request for a specific vehicle.
     * Restricted to users with the 'USER' (Driver) role.
     *
     * @param dto       Data Transfer Object containing the VIN and requested services.
     * @param principal The currently authenticated user.
     * @return ResponseEntity containing the created ServiceRequestResponse details.
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ServiceRequestResponse> createRequest(@RequestBody CreateServiceRequest dto, Principal principal) {
        log.info("Action: Creating new service request for VIN: {} by user: {}", dto.getVin(), principal.getName());
        try {
            return ResponseEntity.ok(serviceRequestService.createRequest(dto, principal.getName()));
        } catch (Exception e) {
            log.error("Failed to create service request for VIN: {}", dto.getVin(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Retrieves all active and historical service requests belonging to the authenticated user.
     *
     * @param principal The currently authenticated user.
     * @return ResponseEntity containing a list of the user's ServiceRequestResponse objects.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ServiceRequestResponse>> getMyRequests(Principal principal) {
        log.info("Action: Fetching all service requests for user: {}", principal.getName());
        return ResponseEntity.ok(serviceRequestService.getRequestsByCustomer(principal.getName()));
    }

    /**
     * Retrieves detailed information for a specific service request.
     * Access is restricted to the vehicle owner, the assigned STO admin, or global admins.
     *
     * @param requestId The ID of the service request.
     * @param principal The currently authenticated user.
     * @return ResponseEntity containing detailed ServiceRequestResponse.
     */
    @GetMapping("/{requestId}")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<ServiceRequestResponse> getRequestDetails(
            @PathVariable Long requestId,
            Principal principal) {
        log.info("Action: Fetching details for Service Request ID: {} requested by: {}", requestId, principal.getName());
        try {
            ServiceRequestResponse response = serviceRequestService.getRequestDetails(requestId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Access denied or request not found for ID: {}. Reason: {}", requestId, e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            log.error("Error fetching request details for ID: {}", requestId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ============================================================================
    // ACTION ENDPOINTS (PAYMENT & CANCELLATION)
    // ============================================================================

    /**
     * Processes an online payment (deposit) for a specific service request.
     *
     * @param requestId The ID of the service request.
     * @param principal The currently authenticated user (vehicle owner).
     * @return ResponseEntity containing the payment confirmation details.
     */
    @PostMapping("/{requestId}/pay-online")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PaymentResponse> payOnline(@PathVariable Long requestId, Principal principal) {
        log.info("Action: Processing online payment for Request ID: {} by user: {}", requestId, principal.getName());
        try {
            PaymentResponse response = serviceRequestService.payOnline(requestId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Payment failed for Request ID: {}", requestId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Cancels an active service request.
     * Can be invoked by the vehicle owner or the STO admin before work begins.
     *
     * @param id        The ID of the service request to cancel.
     * @param cancelDto DTO containing the cancellation reason.
     * @param principal The currently authenticated user.
     * @return ResponseEntity containing the updated ServiceRequestResponse, or an error message.
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'STO')")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id, @RequestBody CancelRequestDto cancelDto, Principal principal) {
        log.info("Action: Cancelling Request ID: {} by user: {}. Reason: {}", id, principal.getName(), cancelDto.getReason());
        try {
            ServiceRequestResponse response = serviceRequestService.cancelRequest(id, principal.getName(), cancelDto.getReason());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error while cancelling Request ID: {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to cancel request: " + e.getMessage());
        }
    }

    // ============================================================================
    // DOCUMENTS & INTEGRITY AUDIT ENDPOINTS
    // ============================================================================

    /**
     * Downloads a generated PDF document associated with a service request.
     *
     * @param id        The ID of the service request.
     * @param docType   The type of document (e.g., 'service_request', 'inspection_report').
     * @param principal The currently authenticated user.
     * @return ResponseEntity containing the PDF file resource.
     */
    @GetMapping("/{id}/document/{docType}")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id, @PathVariable String docType, Principal principal) {
        log.info("Action: Downloading document type '{}' for Request ID: {} by user: {}", docType, id, principal.getName());
        try {
            Resource resource = pdfService.downloadDocument(id, docType, principal.getName());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.warn("Document not found or access denied for Request ID: {}, Type: {}", id, docType);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Verifies the integrity of a specific document by comparing its local hash
     * against the immutable hash stored on the blockchain.
     *
     * @param id      The ID of the service request.
     * @param docType The type of document to verify.
     * @return ResponseEntity containing the boolean verification result.
     */
    @GetMapping("/{id}/verify-integrity/{docType}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IntegrityCheckResponse> verifyIntegrity(@PathVariable Long id, @PathVariable String docType) {
        log.info("Action: Verifying document integrity for Request ID: {}, Type: {}", id, docType);
        try {
            return ResponseEntity.ok(serviceRequestService.verifyDocumentIntegrity(id, docType));
        } catch (Exception e) {
            log.error("Integrity verification failed for Request ID: {}, Type: {}: {}", id, docType, e.getMessage());
            return ResponseEntity.badRequest().body(IntegrityCheckResponse.builder()
                    .valid(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}