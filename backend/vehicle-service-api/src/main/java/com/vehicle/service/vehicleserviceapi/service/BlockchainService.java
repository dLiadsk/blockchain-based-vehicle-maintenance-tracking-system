package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.contracts.VehicleService;
import com.vehicle.service.vehicleserviceapi.dto.BlockchainResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

/**
 * Service responsible for interacting with the Ethereum smart contract.
 * Part of the "Blockchain-based Vehicle Maintenance Tracking System".
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final Web3j web3j; // Injected from Web3Config
    private VehicleService contract;

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.admin-private-key}")
    private String adminPrivateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    /**
     * Initializes the smart contract wrapper using the provided administrative credentials.
     */
    @PostConstruct
    public void init() {
        try {
            String clientVersion = web3j.web3ClientVersion().send().getWeb3ClientVersion();
            Credentials credentials = Credentials.create(adminPrivateKey);

            // Load the generated contract wrapper
            this.contract = VehicleService.load(
                    contractAddress,
                    web3j,
                    credentials,
                    new DefaultGasProvider()
            );

            log.info("Blockchain Service successfully initialized");
            log.info("Connected to Ethereum client version: {}", clientVersion);
        } catch (Exception e) {
            log.error("Blockchain initialization failed. Check if the RPC node at {} is running.", rpcUrl);
            throw new RuntimeException("Blockchain connection error", e);
        }
    }

    /**
     * Registers a new vehicle in the blockchain ledger.
     */
    public String registerVehicle(String vin, String passportHash) throws Exception {
        log.info("Blockchain: Registering vehicle with VIN: {}", vin);
        TransactionReceipt receipt = contract.registerVehicle(vin, passportHash).send();
        log.info("Vehicle registration successful. Tx Hash: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }

    /**
     * Creates a service request and retrieves the Job ID emitted by the contract events.
     */
    public BlockchainResult createServiceRequest(String vin, String pdfHash) throws Exception {
        log.info("Blockchain: Creating service request for VIN: {}", vin);

        TransactionReceipt receipt = contract.createRequest(vin, pdfHash).send();

        var events = contract.getStatusChangedEvents(receipt);
        if (events.isEmpty()) {
            log.error("Blockchain event 'StatusChanged' not found in transaction: {}", receipt.getTransactionHash());
            throw new RuntimeException("Blockchain failed to return Job ID (Event not found)");
        }

        Long jobId = events.get(0).jobId.longValue();
        String txHash = receipt.getTransactionHash();

        return new BlockchainResult(jobId, txHash);
    }

    /**
     * Confirms the acceptance of a service request by the STO.
     */
    public String adminApprove(Long jobId) throws Exception {
        log.info("Blockchain: Approving job ID: {}", jobId);
        TransactionReceipt receipt = contract.adminApprove(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    /**
     * Records the physical arrival of the vehicle at the service station.
     */
    public String markArrival(Long jobId) throws Exception {
        log.info("Blockchain: Marking vehicle arrival for job ID: {}", jobId);
        TransactionReceipt receipt = contract.markArrival(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    /**
     * Records the technical inspection results and the estimated financial details.
     */
    public String setInspectionResult(Long jobId, Long total, Long deposit, String pdfHash) throws Exception {
        log.info("Blockchain: Setting inspection results for job ID: {}", jobId);

        TransactionReceipt receipt = contract.setInspectionResult(
                BigInteger.valueOf(jobId),
                BigInteger.valueOf(total),
                BigInteger.valueOf(deposit),
                pdfHash
        ).send();

        return receipt.getTransactionHash();
    }

    /**
     * Confirms that the required deposit has been paid offline.
     */
    public String confirmDepositPaid(Long jobId, String receiptHash) throws Exception {
        log.info("Blockchain: Confirming deposit payment for job ID: {}", jobId);

        TransactionReceipt receipt = contract.confirmDepositPaid(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();

        return receipt.getTransactionHash();
    }

    /**
     * Processes an online deposit payment and updates the blockchain state.
     */
    public String payDepositOnline(Long jobId, String receiptHash) throws Exception {
        log.info("Blockchain: Processing online deposit for job ID: {}", jobId);

        TransactionReceipt receipt = contract.payDepositOnline(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();

        log.info("Online payment transaction successful: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }

    /**
     * Updates the status to indicate that repair work has officially started.
     */
    public String startRepair(Long jobId) throws Exception {
        log.info("Blockchain: Starting repair work for job ID: {}", jobId);
        TransactionReceipt receipt = contract.startRepair(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    /**
     * Marks the repair as complete and updates the final total cost in the contract.
     */
    public String completeRepair(Long jobId, String workReportHash, Long finalTotal) throws Exception {
        log.info("Blockchain: Completing repair for job ID: {}. Final total: {} UAH", jobId, finalTotal);

        TransactionReceipt receipt = contract.completeRepair(
                BigInteger.valueOf(jobId),
                workReportHash,
                BigInteger.valueOf(finalTotal)
        ).send();

        log.info("Repair completion transaction successful: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }

    /**
     * Finalizes the maintenance cycle after the vehicle pick-up and full payment.
     */
    public String finalizeJob(Long jobId, String finalReceiptHash) throws Exception {
        log.info("Blockchain: Finalizing job ID: {}", jobId);

        TransactionReceipt receipt = contract.finalizeJob(
                BigInteger.valueOf(jobId),
                finalReceiptHash
        ).send();

        return receipt.getTransactionHash();
    }
}