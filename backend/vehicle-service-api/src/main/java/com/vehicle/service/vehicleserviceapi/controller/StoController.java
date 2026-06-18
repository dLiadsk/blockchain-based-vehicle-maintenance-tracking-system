package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.service.StoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST Controller for Service Station (STO) operations.
 * Manages the workflow of vehicle repairs: approvals, inspections, payments, and finalization.
 * All actions are strictly restricted to users with the 'STO' role.
 */
@RestController
@RequestMapping("/api/sto")
@PreAuthorize("hasRole('STO')")
@RequiredArgsConstructor
@Slf4j
public class StoController {

    private final StoService stoService;

    // ============================================================================
    // DASHBOARD & RETRIEVAL ENDPOINTS
    // ============================================================================

    /**
     * Retrieves all service requests assigned to the STO managed by the authenticated admin.
     *
     * @param principal The currently authenticated STO admin.
     * @return A list of service requests associated with this STO.
     */
    @GetMapping("/requests")
    public ResponseEntity<List<ServiceRequestResponse>> getMyStationRequests(Principal principal) {
        log.info("STO Action: Fetching all service requests for STO admin: {}", principal.getName());
        return ResponseEntity.ok(stoService.getStationRequests(principal.getName()));
    }

    // ============================================================================
    // REPAIR WORKFLOW ENDPOINTS (STATE MACHINE)
    // ============================================================================

    /**
     * Step 1: Approves an incoming service request and sets arrival instructions.
     *
     * @param requestId The ID of the pending request.
     * @param dto       Data containing instructions for the customer.
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/approve/{requestId}")
    public ResponseEntity<String> approveRequest(@PathVariable Long requestId, @RequestBody ApproveRequest dto, Principal principal) {
        log.info("STO Action: Approving request ID: {} by admin: {}", requestId, principal.getName());
        try {
            stoService.approveRequest(requestId, dto, principal.getName());
            return ResponseEntity.ok("Request approved. Instructions sent to customer.");
        } catch (Exception e) {
            log.error("Failed to approve request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to approve request: " + e.getMessage());
        }
    }

    /**
     * Step 2: Marks the vehicle as physically arrived at the service station.
     *
     * @param requestId The ID of the approved request.
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/mark-arrival/{requestId}")
    public ResponseEntity<String> markArrival(@PathVariable Long requestId, Principal principal) {
        log.info("STO Action: Marking arrival for vehicle in request ID: {}", requestId);
        try {
            stoService.markArrival(requestId, principal.getName());
            return ResponseEntity.ok("Vehicle arrival recorded.");
        } catch (Exception e) {
            log.error("Failed to mark arrival for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to mark arrival: " + e.getMessage());
        }
    }

    /**
     * Step 3: Records the results of the physical vehicle inspection.
     * Generates an inspection report and sets the required deposit.
     *
     * @param requestId The ID of the arrived request.
     * @param dto       Inspection details including findings and costs.
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/inspection/{requestId}")
    public ResponseEntity<String> setInspectionResult(@PathVariable Long requestId, @RequestBody InspectionRequest dto, Principal principal) {
        log.info("STO Action: Recording inspection results for request ID: {}", requestId);
        try {
            stoService.setInspectionResult(requestId, dto, principal.getName());
            return ResponseEntity.ok("Inspection completed. Customer notified of costs.");
        } catch (Exception e) {
            log.error("Failed to set inspection results for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to record inspection: " + e.getMessage());
        }
    }

    /**
     * Step 4: Manually confirms the receipt of a deposit payment (e.g., cash payment).
     *
     * @param requestId The ID of the inspected request.
     * @param principal The STO admin executing the action.
     * @return Payment confirmation details.
     */
    @PostMapping("/confirm-payment/{requestId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Long requestId, Principal principal) {
        log.info("STO Action: Manually confirming deposit payment for request ID: {}", requestId);
        try {
            PaymentResponse response = stoService.confirmPayment(requestId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to confirm payment for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Payment confirmation failed: " + e.getMessage());
        }
    }

    /**
     * Step 5: Initiates the actual repair work on the vehicle.
     *
     * @param requestId The ID of the paid request.
     * @param dto       Details regarding the repair initiation (e.g., estimated completion time).
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/start-repair/{requestId}")
    public ResponseEntity<String> startRepair(@PathVariable Long requestId, @RequestBody StartRepairRequest dto, Principal principal) {
        log.info("STO Action: Starting repair work for request ID: {}", requestId);
        try {
            stoService.startRepair(requestId, dto, principal.getName());
            return ResponseEntity.ok("Status updated to: Work In Progress.");
        } catch (Exception e) {
            log.error("Failed to start repair for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to start repair: " + e.getMessage());
        }
    }

    /**
     * Step 6: Marks the repair work as completed and generates the final work report.
     *
     * @param requestId The ID of the in-progress request.
     * @param dto       Final work details, parts replaced, and total costs.
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/complete-repair/{requestId}")
    public ResponseEntity<String> completeRepair(@PathVariable Long requestId, @RequestBody WorkReportRequest dto, Principal principal) {
        log.info("STO Action: Completing repair work for request ID: {}", requestId);
        try {
            stoService.completeRepair(requestId, dto, principal.getName());
            return ResponseEntity.ok("Repair completed. Final report generated.");
        } catch (Exception e) {
            log.error("Failed to complete repair for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to complete repair: " + e.getMessage());
        }
    }

    /**
     * Step 7: Finalizes the job, confirming final payment and releasing the vehicle to the customer.
     *
     * @param requestId The ID of the completed request.
     * @param principal The STO admin executing the action.
     * @return A success message.
     */
    @PostMapping("/finalize/{requestId}")
    public ResponseEntity<String> finalizeJob(@PathVariable Long requestId, Principal principal) {
        log.info("STO Action: Finalizing job and releasing vehicle for request ID: {}", requestId);
        try {
            stoService.finalizeJob(requestId, principal.getName());
            return ResponseEntity.ok("Job finalized. Vehicle released to customer.");
        } catch (Exception e) {
            log.error("Failed to finalize job for request ID: {}", requestId, e);
            return ResponseEntity.badRequest().body("Failed to finalize job: " + e.getMessage());
        }
    }
}