package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.BlockchainResult;
import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestDTO;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import com.vehicle.service.vehicleserviceapi.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;

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

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createRequest(@RequestBody ServiceRequestDTO dto, Principal principal) {
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

            String pdfHash = pdfService.generateServiceRequestPdfHash(
                    vehicle.getVin(),
                    dto.getDescription(),
                    customer.getFirstName() + " " + customer.getLastName()
            );

            BlockchainResult result = blockchainService.createServiceRequest(vehicle.getVin(), pdfHash);

            ServiceRequest request = new ServiceRequest();
            request.setVehicle(vehicle);
            request.setCustomer(customer);
            request.setStoProfile(stoProfile);
            request.setDescription(dto.getDescription());
            request.setStatus("RequestCreated");
            request.setCreatedAt(LocalDateTime.now());

            request.setBlockchainJobId(result.jobId());
            request.setBlockchainTxHash(result.txHash());
            request.setPdfHash(pdfHash);

            ServiceRequest savedRequest = requestRepository.save(request);

            log.info("Заявку успішно зафіксовано. JobId: {}, PDF Hash: {}", result.jobId(), result.txHash());
            return ResponseEntity.ok(savedRequest);

        } catch (Exception e) {
            log.error("Помилка при створенні заявки: ", e);
            return ResponseEntity.internalServerError().body("Помилка сервера: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyRequests(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).get();
        return ResponseEntity.ok(requestRepository.findAllByCustomerId(user.getId()));
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
            return ResponseEntity.ok(request);
        }

        return ResponseEntity.status(403).body("У вас немає доступу до перегляду цієї заявки");
    }
}