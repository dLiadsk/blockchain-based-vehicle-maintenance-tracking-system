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
 * Controller for Service Station (STO) operations.
 * Actions are restricted to users with the 'STO' role.
 */
@RestController
@RequestMapping("/api/sto")
@PreAuthorize("hasRole('STO')")
@RequiredArgsConstructor
@Slf4j
public class StoController {

    private final StoService stoService;

    @GetMapping("/requests")
    public ResponseEntity<List<ServiceRequestResponse>> getMyStationRequests(Principal principal) {
        return ResponseEntity.ok(stoService.getStationRequests(principal.getName()));
    }

    @PostMapping("/approve/{requestId}")
    public ResponseEntity<String> approveRequest(@PathVariable Long requestId, @RequestBody ApproveRequest dto, Principal principal) throws Exception {
        stoService.approveRequest(requestId, dto, principal.getName());
        return ResponseEntity.ok("Request approved. Instructions sent to customer.");
    }

    @PostMapping("/mark-arrival/{requestId}")
    public ResponseEntity<String> markArrival(@PathVariable Long requestId, Principal principal) throws Exception {
        stoService.markArrival(requestId, principal.getName());
        return ResponseEntity.ok("Vehicle arrival recorded.");
    }

    @PostMapping("/inspection/{requestId}")
    public ResponseEntity<String> setInspectionResult(@PathVariable Long requestId, @RequestBody InspectionRequest dto, Principal principal) throws Exception {
        stoService.setInspectionResult(requestId, dto, principal.getName());
        return ResponseEntity.ok("Inspection completed. Customer notified of costs.");
    }

    @PostMapping("/confirm-payment/{requestId}")
    public ResponseEntity<PaymentResponse> confirmPayment(@PathVariable Long requestId, Principal principal) throws Exception {
        PaymentResponse response = stoService.confirmPayment(requestId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/start-repair/{requestId}")
    public ResponseEntity<String> startRepair(@PathVariable Long requestId,@RequestBody StartRepairRequest dto, Principal principal) throws Exception {
        stoService.startRepair(requestId, dto, principal.getName());
        return ResponseEntity.ok("Status updated to: Work In Progress.");
    }

    @PostMapping("/complete-repair/{requestId}")
    public ResponseEntity<String> completeRepair(@PathVariable Long requestId, @RequestBody WorkReportRequest dto, Principal principal) throws Exception {
        stoService.completeRepair(requestId, dto, principal.getName());
        return ResponseEntity.ok("Repair completed. Final report generated.");
    }

    @PostMapping("/finalize/{requestId}")
    public ResponseEntity<String> finalizeJob(@PathVariable Long requestId, Principal principal) throws Exception {
        stoService.finalizeJob(requestId, principal.getName());
        return ResponseEntity.ok("Job finalized. Vehicle released to customer.");
    }
}