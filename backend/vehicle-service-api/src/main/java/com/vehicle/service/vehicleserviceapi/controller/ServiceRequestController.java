package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.service.PdfService;
import com.vehicle.service.vehicleserviceapi.service.ServiceRequestService;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for managing service requests.
 */
@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final PdfService pdfService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ServiceRequestResponse> createRequest(@RequestBody CreateServiceRequest dto, Principal principal) {
        log.debug("REST request to create service request for VIN: {}", dto.getVin());
        try {
            return ResponseEntity.ok(serviceRequestService.createRequest(dto, principal.getName()));
        } catch (Exception e) {
            log.error("Failed to create request: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ServiceRequestResponse>> getMyRequests(Principal principal) {
        return ResponseEntity.ok(serviceRequestService.getRequestsByCustomer(principal.getName()));
    }

    @PostMapping("/{requestId}/pay-online")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PaymentResponse> payOnline(@PathVariable Long requestId, Principal principal) {
        try {
            PaymentResponse response = serviceRequestService.payOnline(requestId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Payment failed: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    /**
     * Retrieves detailed information for a specific service request.
     * Accessible by both the vehicle owner and the assigned STO admin.
     */
    @GetMapping("/{requestId}")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<ServiceRequestResponse> getRequestDetails(
            @PathVariable Long requestId,
            Principal principal) {
        log.debug("REST request to get Service Request details for ID: {}", requestId);
        try {
            ServiceRequestResponse response = serviceRequestService.getRequestDetails(requestId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Access denied or not found: {}", e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            log.error("Error fetching request details: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    @GetMapping("/{id}/document/{docType}")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id, @PathVariable String docType, Principal principal) {
        try {
            Resource resource = pdfService.downloadDocument(id, docType, principal.getName());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        }
        catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id, @RequestBody CancelRequestDto cancelDto, Principal principal) {
        try {
            ServiceRequestResponse response = serviceRequestService.cancelRequest(id, principal.getName(), cancelDto.getReason());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Помилка при скасуванні заявки: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/{id}/verify-integrity/{docType}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<IntegrityCheckResponse> verifyIntegrity(@PathVariable Long id, @PathVariable String docType) {
        try {
            return ResponseEntity.ok(serviceRequestService.verifyDocumentIntegrity(id, docType));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(IntegrityCheckResponse.builder()
                    .isValid(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}