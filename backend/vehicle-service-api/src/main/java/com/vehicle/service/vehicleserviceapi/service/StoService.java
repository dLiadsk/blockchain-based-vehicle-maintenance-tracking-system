package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service handling the workflow for Service Stations (STO).
 * Manages the lifecycle of a request from approval to finalization.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StoService {

    private final ServiceRequestRepository requestRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final BlockchainService blockchainService;
    private final PdfService pdfService;
    private final DtoMapper dtoMapper;

    /**
     * Retrieves all requests assigned to the administrator's station.
     */
    public List<ServiceRequestResponse> getStationRequests(String email) {
        User admin = userRepository.findByEmail(email).orElseThrow();
        return requestRepository.findAllByStoProfileId(admin.getStoProfile().getId())
                .stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approves a user's request and provides arrival instructions.
     */
    @Transactional
    public void approveRequest(Long requestId, ApproveRequest dto, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String txHash = blockchainService.adminApprove(request.getBlockchainJobId());

        request.setStatus("AcceptedByAdmin");
        request.setBlockchainTxHash(txHash);
        request.setArrivalInstructions("STO Address: " + request.getStoProfile().getAddress() + ". Note: " + dto.getMessage());

        requestRepository.save(request);
        recordHistory(request, "AcceptedByAdmin", txHash);
    }

    /**
     * Records the physical arrival of the vehicle.
     */
    @Transactional
    public void markArrival(Long requestId, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String txHash = blockchainService.markArrival(request.getBlockchainJobId());

        request.setStatus("VehicleArrived");
        request.setBlockchainTxHash(txHash);

        requestRepository.save(request);
        recordHistory(request, "VehicleArrived", txHash);
    }

    /**
     * Performs technical inspection and generates the cost estimate PDF.
     */
    @Transactional
    public void setInspectionResult(Long requestId, InspectionRequest dto, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String pdfHash = pdfService.generateInspectionPdf(
                request.getVehicle().getVin(),
                dto.getFindings(),
                dto.getTotalAmount(),
                dto.getDepositAmount()
        );

        String txHash = blockchainService.setInspectionResult(
                request.getBlockchainJobId(),
                dto.getTotalAmount(),
                dto.getDepositAmount(),
                pdfHash
        );

        request.setStatus("Inspected");
        request.setTotalAmount(dto.getTotalAmount());
        request.setDepositAmount(dto.getDepositAmount());
        request.setInspectionPdfHash(pdfHash);
        request.setBlockchainTxHash(txHash);

        requestRepository.save(request);
        recordHistory(request, "Inspected", txHash);
    }

    /**
     * Confirms offline payment and returns payment details.
     */
    @Transactional
    public PaymentResponse confirmPayment(Long requestId, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String receiptHash = pdfService.generatePaymentReceiptPdf(
                request.getId(),
                request.getVehicle().getVin(),
                request.getDepositAmount(),
                "Station Terminal/Cash"
        );

        String txHash = blockchainService.confirmDepositPaid(request.getBlockchainJobId(), receiptHash);

        request.setStatus("ReadyForRepair");
        request.setPaymentReceiptPdfHash(receiptHash);
        request.setBlockchainTxHash(txHash);
        requestRepository.save(request);

        recordHistory(request, "ReadyForRepair", txHash);

        return PaymentResponse.builder()
                .txHash(txHash)
                .paymentDate(LocalDateTime.now())
                .receiptPdfHash(receiptHash)
                .build();
    }

    /**
     * Officially starts the repair process.
     */
    @Transactional
    public void startRepair(Long requestId, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);
        String txHash = blockchainService.startRepair(request.getBlockchainJobId());

        request.setStatus("WorkInProgress");
        request.setBlockchainTxHash(txHash);

        requestRepository.save(request);
        recordHistory(request, "WorkInProgress", txHash);
    }

    /**
     * Completes repair, generates work report, and sets final amount.
     */
    @Transactional
    public void completeRepair(Long requestId, WorkReportRequest dto, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String reportHash = pdfService.generateWorkReportPdf(
                request.getVehicle().getVin(),
                dto.getItems(),
                dto.getFinalTotalAmount()
        );

        String txHash = blockchainService.completeRepair(
                request.getBlockchainJobId(),
                reportHash,
                dto.getFinalTotalAmount()
        );

        request.setStatus("ReadyForPickup");
        request.setWorkReportPdfHash(reportHash);
        request.setTotalAmount(dto.getFinalTotalAmount());
        request.setBlockchainTxHash(txHash);

        requestRepository.save(request);
        recordHistory(request, "ReadyForPickup", txHash);
    }

    /**
     * Finalizes the job after the customer picks up the car and pays the balance.
     */
    @Transactional
    public void finalizeJob(Long requestId, String email) throws Exception {
        ServiceRequest request = validateAndGetRequest(requestId, email);

        String finalReceiptHash = pdfService.generateFinalReceiptPdf(
                request.getId(),
                request.getVehicle().getVin(),
                request.getTotalAmount(),
                request.getDepositAmount()
        );

        String txHash = blockchainService.finalizeJob(request.getBlockchainJobId(), finalReceiptHash);

        request.setStatus("Finalized");
        request.setBlockchainTxHash(txHash);
        request.setPaymentReceiptPdfHash(finalReceiptHash);

        requestRepository.save(request);
        recordHistory(request, "Finalized", txHash);
    }

    // --- Private Helpers ---

    private ServiceRequest validateAndGetRequest(Long requestId, String email) {
        User admin = userRepository.findByEmail(email).orElseThrow();
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found"));

        if (!request.getStoProfile().getId().equals(admin.getStoProfile().getId())) {
            throw new RuntimeException("Access Denied: This request belongs to a different station");
        }
        return request;
    }

    private void recordHistory(ServiceRequest request, String status, String txHash) {
        StatusHistory history = StatusHistory.builder()
                .serviceRequest(request)
                .status(status)
                .blockchainTxHash(txHash)
                .build();
        statusHistoryRepository.save(history);
    }
}