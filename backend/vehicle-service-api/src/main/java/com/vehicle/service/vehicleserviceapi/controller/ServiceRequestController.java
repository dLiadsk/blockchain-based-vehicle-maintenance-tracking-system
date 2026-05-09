package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.BlockchainResult;
import com.vehicle.service.vehicleserviceapi.dto.CreateServiceRequest;
import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import com.vehicle.service.vehicleserviceapi.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestController {

    private final ServiceRequestRepository requestRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final StoProfileRepository stoProfileRepository;
    private final PdfService pdfService;
    private final BlockchainService blockchainService;
    private final DtoMapper dtoMapper;

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createRequest(@RequestBody CreateServiceRequest dto, Principal principal) {
        try {
            User customer = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Поточного користувача не знайдено"));

            Vehicle vehicle = vehicleRepository.findByVin(dto.getVin())
                    .orElseThrow(() -> new RuntimeException("Авто з VIN " + dto.getVin() + " не знайдено"));

            if (!vehicle.getOwner().getId().equals(customer.getId())) {
                return ResponseEntity.status(403).body("Ви не власник цього авто");
            }

            StoProfile stoProfile = stoProfileRepository.findById(dto.getStoId())
                    .orElseThrow(() -> new RuntimeException("Обране СТО не знайдено"));

            // 1. Генеруємо PDF та отримуємо його хеш
            String pdfHash = pdfService.generateAndSaveServiceRequestPdf(
                    vehicle.getVin(),
                    dto.getDescription(),
                    customer.getFirstName() + " " + customer.getLastName()
            );

            // 2. Запис у блокчейн (отримуємо рекорд із jobId та txHash)
            BlockchainResult result = blockchainService.createServiceRequest(vehicle.getVin(), pdfHash);

            // 3. Збереження в базу даних
            ServiceRequest request = new ServiceRequest();
            request.setVehicle(vehicle);
            request.setCustomer(customer);
            request.setStoProfile(stoProfile);
            request.setDescription(dto.getDescription());
            request.setStatus("RequestCreated");
            request.setCreatedAt(LocalDateTime.now());

            request.setBlockchainJobId(result.jobId());
            request.setBlockchainTxHash(result.txHash());
            request.setPdfHash(pdfHash); // Зберігаємо хеш PDF

            ServiceRequest savedRequest = requestRepository.save(request);

            log.info("Заявку зафіксовано. JobId: {}, TxHash: {}", result.jobId(), result.txHash());

            return ResponseEntity.ok(dtoMapper.toServiceRequestResponse(savedRequest));

        } catch (Exception e) {
            log.error("Помилка при створенні заявки: ", e);
            return ResponseEntity.internalServerError().body("Помилка сервера: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyRequests(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        List<ServiceRequest> requests = requestRepository.findAllByCustomerId(user.getId());
        List<ServiceRequestResponse> responseList = requests.stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'STO')")
    public ResponseEntity<?> getRequestDetails(@PathVariable Long id, Principal principal) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

        User currentUser = userRepository.findByEmail(principal.getName()).get();

        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());

        boolean isTargetSto = currentUser.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());

        if (isOwner || isTargetSto) {
            return ResponseEntity.ok(dtoMapper.toServiceRequestResponse(request));
        }

        return ResponseEntity.status(403).body("У вас немає доступу до перегляду цієї заявки");
    }
    @PostMapping("/{requestId}/pay-online")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> payOnline(@PathVariable Long requestId, Principal principal) {
        try {
            ServiceRequest request = requestRepository.findById(requestId).orElseThrow();

            log.info("Клієнт {} оплачує онлайн заявку {}", principal.getName(), requestId);
            String fakeTransactionId = "PAY-" + UUID.randomUUID().toString().substring(0, 8);

            String receiptHash = pdfService.generateOnlineReceiptPdf(
                    request.getId(),
                    request.getVehicle().getVin(),
                    request.getDepositAmount(),
                    fakeTransactionId
            );

            String txHash = blockchainService.payDepositOnline(
                    request.getBlockchainJobId(),
                    receiptHash
            );

            request.setStatus("DepositPaid");
            request.setPaymentReceiptPdfHash(receiptHash);
            request.setBlockchainTxHash(txHash);
            requestRepository.save(request);

            return ResponseEntity.ok("Оплата успішна. Статус в блокчейні оновлено.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка оплати: " + e.getMessage());
        }
    }

}