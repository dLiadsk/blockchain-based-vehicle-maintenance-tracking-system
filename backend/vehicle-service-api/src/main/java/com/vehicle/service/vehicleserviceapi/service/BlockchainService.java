package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.contracts.VehicleService;
import com.vehicle.service.vehicleserviceapi.dto.BlockchainJobDto;
import com.vehicle.service.vehicleserviceapi.dto.BlockchainResult;
import com.vehicle.service.vehicleserviceapi.dto.JobHistoryEventDto;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.*;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthLog;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Core integration service responsible for executing transactions and reading data
 * from the Ethereum/Bloxsberg smart contract.
 * Part of the "Blockchain-based Vehicle Maintenance Tracking System".
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final Web3j web3j; // Injected via Web3Config
    private VehicleService contract;

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.admin-private-key}")
    private String adminPrivateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    /**
     * Initializes the smart contract wrapper using the provided administrative credentials
     * immediately after the Spring bean is constructed.
     */
    @PostConstruct
    public void init() {
        try {
            String clientVersion = web3j.web3ClientVersion().send().getWeb3ClientVersion();
            Credentials credentials = Credentials.create(adminPrivateKey);

            // Load the generated Web3j contract wrapper
            this.contract = VehicleService.load(
                    contractAddress,
                    web3j,
                    credentials,
                    new DefaultGasProvider()
            );

            log.info("Blockchain Service successfully initialized.");
            log.info("Connected to EVM client version: {}", clientVersion);
        } catch (Exception e) {
            log.error("Blockchain initialization failed. Ensure the RPC node at {} is operational.", rpcUrl);
            throw new RuntimeException("Blockchain connection error", e);
        }
    }

    /**
     * Registers a new vehicle in the decentralized ledger.
     */
    public String registerVehicle(String vin, String passportHash) throws Exception {
        log.info("Blockchain Action: Registering vehicle with VIN: {}", vin);
        TransactionReceipt receipt = contract.registerVehicle(vin, passportHash).send();
        log.info("Vehicle registration successful. Tx Hash: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }

    /**
     * Creates a service request on-chain and retrieves the emitted Job ID.
     */
    public BlockchainResult createServiceRequest(String vin, String pdfHash) throws Exception {
        log.info("Blockchain Action: Creating service request for VIN: {}", vin);

        TransactionReceipt receipt = contract.createRequest(vin, pdfHash).send();

        var events = contract.getStatusChangedEvents(receipt);
        if (events.isEmpty()) {
            log.error("Critical failure: 'StatusChanged' event not found in transaction: {}", receipt.getTransactionHash());
            throw new RuntimeException("Blockchain failed to return a valid Job ID (Event missing)");
        }

        Long jobId = events.get(0).jobId.longValue();
        String txHash = receipt.getTransactionHash();

        return new BlockchainResult(jobId, txHash);
    }

    public String adminApprove(Long jobId) throws Exception {
        log.info("Blockchain Action: Approving job ID: {}", jobId);
        TransactionReceipt receipt = contract.adminApprove(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    public String markArrival(Long jobId) throws Exception {
        log.info("Blockchain Action: Marking physical arrival for job ID: {}", jobId);
        TransactionReceipt receipt = contract.markArrival(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    public String setInspectionResult(Long jobId, Long total, Long deposit, String pdfHash) throws Exception {
        log.info("Blockchain Action: Recording inspection results for job ID: {}", jobId);
        TransactionReceipt receipt = contract.setInspectionResult(
                BigInteger.valueOf(jobId),
                BigInteger.valueOf(total),
                BigInteger.valueOf(deposit),
                pdfHash
        ).send();
        return receipt.getTransactionHash();
    }

    public String confirmDepositPaid(Long jobId, String receiptHash) throws Exception {
        log.info("Blockchain Action: Confirming manual deposit payment for job ID: {}", jobId);
        TransactionReceipt receipt = contract.confirmDepositPaid(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();
        return receipt.getTransactionHash();
    }

    public String payDepositOnline(Long jobId, String receiptHash) throws Exception {
        log.info("Blockchain Action: Processing online deposit Webhook for job ID: {}", jobId);
        TransactionReceipt receipt = contract.payDepositOnline(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();
        return receipt.getTransactionHash();
    }

    public String startRepair(Long jobId) throws Exception {
        log.info("Blockchain Action: Initiating repair phase for job ID: {}", jobId);
        TransactionReceipt receipt = contract.startRepair(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }

    public String completeRepair(Long jobId, String workReportHash, Long finalTotal) throws Exception {
        log.info("Blockchain Action: Completing repair for job ID: {}. Final evaluation: {} UAH", jobId, finalTotal);
        TransactionReceipt receipt = contract.completeRepair(
                BigInteger.valueOf(jobId),
                workReportHash,
                BigInteger.valueOf(finalTotal)
        ).send();
        return receipt.getTransactionHash();
    }

    public String finalizeJob(Long jobId, String finalReceiptHash) throws Exception {
        log.info("Blockchain Action: Finalizing job ID: {}", jobId);
        TransactionReceipt receipt = contract.finalizeJob(
                BigInteger.valueOf(jobId),
                finalReceiptHash
        ).send();
        return receipt.getTransactionHash();
    }

    public String cancelRequest(Long jobId, String reason) throws Exception {
        log.info("Blockchain Action: Cancelling job ID: {} with reason: '{}'", jobId, reason);
        TransactionReceipt receipt = contract.cancelRequest(
                BigInteger.valueOf(jobId),
                reason
        ).send();
        return receipt.getTransactionHash();
    }

    // ============================================================================
    // AUDIT & DATA RETRIEVAL (READ-ONLY CONTRACT CALLS)
    // ============================================================================

    /**
     * Reads the current state of a repair job directly from the blockchain by executing
     * a manual ethCall. This avoids wrapper limitations and allows for flat ABI decoding.
     * Note: The TypeReferences are aligned exactly with the gas-optimized packed Solidity struct.
     */
    public BlockchainJobDto getJobFromBlockchain(Long jobId) throws Exception {
        log.info("Blockchain Audit: Querying immutable job data for ID: {}", jobId);

        // 1. Manually encode the call to the public mapping 'repairJobs(uint256)'
        Function function = new Function(
                "repairJobs",
                Arrays.asList(new Uint256(jobId)),
                Arrays.asList(
                        new TypeReference<Uint256>() {},    // 0: id
                        new TypeReference<Address>() {},    // 1: client (Packed layout)
                        new TypeReference<Uint8>() {},      // 2: status (Packed layout)
                        new TypeReference<Uint256>() {},    // 3: estimatedTotal
                        new TypeReference<Uint256>() {},    // 4: depositRequired
                        new TypeReference<Utf8String>() {}, // 5: vin
                        new TypeReference<Utf8String>() {}, // 6: cancelReason
                        new TypeReference<Utf8String>() {}, // 7: requestPdfHash
                        new TypeReference<Utf8String>() {}, // 8: inspectionPdfHash
                        new TypeReference<Utf8String>() {}, // 9: workReportPdfHash
                        new TypeReference<Utf8String>() {}  // 10: receiptPdfHash
                )
        );

        String encodedFunction = FunctionEncoder.encode(function);

        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();

        // 2. Validate non-empty response
        if (response.hasError() || response.getValue() == null || response.getValue().equals("0x")) {
            throw new RuntimeException("Blockchain returned an empty payload or encountered an execution error for Job ID: " + jobId);
        }

        // 3. Decode the flat byte array into strongly typed Solidity objects
        List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());

        if (results.isEmpty() || results.size() < 11) {
            throw new RuntimeException("Failed to parse the decoded ABI payload (insufficient fields) for Job ID: " + jobId);
        }

        // 4. Map the decoded Solidity types into the Java DTO
        return BlockchainJobDto.builder()
                .id(((Uint256) results.get(0)).getValue().longValue())
                .clientAddress(((Address) results.get(1)).getValue())
                .statusIndex(((Uint8) results.get(2)).getValue().intValue())
                .estimatedTotal(((Uint256) results.get(3)).getValue().longValue())
                .depositRequired(((Uint256) results.get(4)).getValue().longValue())
                .vin(((Utf8String) results.get(5)).getValue())
                .cancelReason(((Utf8String) results.get(6)).getValue())
                .requestPdfHash(((Utf8String) results.get(7)).getValue())
                .inspectionPdfHash(((Utf8String) results.get(8)).getValue())
                .workReportPdfHash(((Utf8String) results.get(9)).getValue())
                .receiptPdfHash(((Utf8String) results.get(10)).getValue())
                .build();
    }

    /**
     * Retrieves the entire chronological history of status changes for a specific job.
     * Uses an optimized filter approach to prevent Web3j polling timeouts.
     */
    public List<JobHistoryEventDto> getJobHistoryFromBlockchain(Long jobId) throws Exception {
        log.info("Blockchain Audit: Compiling event history ledger for job ID: {}", jobId);

        // 1. Create a broad filter to fetch all historical logs synchronously
        EthFilter filter = new EthFilter(
                DefaultBlockParameterName.EARLIEST,
                DefaultBlockParameterName.LATEST,
                contractAddress
        );

        // 2. Execute a single node query
        List<EthLog.LogResult> logs = web3j.ethGetLogs(filter).send().getLogs();

        // 3. Extract unique transaction hashes to prevent redundant RPC calls
        Set<String> uniqueTxHashes = logs.stream()
                .map(logResult -> ((org.web3j.protocol.core.methods.response.Log) logResult.get()).getTransactionHash())
                .collect(Collectors.toSet());

        List<JobHistoryEventDto> historyList = new ArrayList<>();

        // 4. Fetch the receipt for each transaction and parse its events using the wrapper
        for (String txHash : uniqueTxHashes) {
            var receiptOpt = web3j.ethGetTransactionReceipt(txHash).send().getTransactionReceipt();

            if (receiptOpt.isPresent()) {
                List<VehicleService.StatusChangedEventResponse> parsedEvents = contract.getStatusChangedEvents(receiptOpt.get());

                for (var event : parsedEvents) {
                    if (event.jobId.longValue() == jobId) {
                        historyList.add(JobHistoryEventDto.builder()
                                .jobId(event.jobId.longValue())
                                .statusIndex(event.newStatus.intValue())
                                .reason(event.reason)
                                .transactionHash(event.log.getTransactionHash())
                                .blockNumber(event.log.getBlockNumber().longValue())
                                .build());
                    }
                }
            }
        }

        // 5. Ensure the events are strictly ordered by the block timeline
        historyList.sort(Comparator.comparing(JobHistoryEventDto::getBlockNumber));

        log.info("Successfully consolidated {} historical events for Job ID {}", historyList.size(), jobId);
        return historyList;
    }

    /**
     * Retrieves the total number of repair jobs ever registered in the smart contract.
     */
    public Long getJobCounter() throws Exception {
        log.info("Blockchain Audit: Querying global job counter state.");
        BigInteger counter = contract.jobCounter().send();
        return counter.longValue();
    }
}