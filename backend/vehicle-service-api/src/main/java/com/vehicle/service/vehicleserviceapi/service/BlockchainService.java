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
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.DefaultBlockParameterNumber;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.*;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import java.util.Arrays;
import java.util.List;


import java.math.BigInteger;
import java.util.List;
import java.util.stream.Collectors;

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
    /**
     * Cancels a service request in the blockchain ledger.
     */
    public String cancelRequest(Long jobId, String reason) throws Exception {
        log.info("Blockchain: Cancelling job ID: {} with reason: '{}'", jobId, reason);

        TransactionReceipt receipt = contract.cancelRequest(
                BigInteger.valueOf(jobId),
                reason
        ).send();

        log.info("Job cancellation transaction successful: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }

    /**
     * Reads the current state of a repair job directly from the blockchain.
     * Useful for auditing and verifying PostgreSQL database integrity.
     */
    public BlockchainJobDto getJobFromBlockchain(Long jobId) throws Exception {
        log.info("Blockchain: Manually querying job data for ID: {}", jobId);

        // 1. ВИПРАВЛЕННЯ: Викликаємо автоматичний геттер мапінгу "repairJobs" замість "getJob"
        // Він повертає рівний, плоский список змінних без обгортки у Tuple
        Function function = new Function(
                "repairJobs",
                Arrays.asList(new Uint256(jobId)),
                Arrays.asList(
                        new TypeReference<Uint256>() {},    // 0: id
                        new TypeReference<Utf8String>() {}, // 1: vin
                        new TypeReference<Address>() {},    // 2: client
                        new TypeReference<Uint8>() {},      // 3: status
                        new TypeReference<Uint256>() {},    // 4: estimatedTotal
                        new TypeReference<Uint256>() {},    // 5: depositRequired
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
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST
        ).send();

        // 2. Додаємо перевірку: якщо блокчейн нічого не повернув
        if (response.hasError() || response.getValue() == null || response.getValue().equals("0x")) {
            throw new RuntimeException("Блокчейн повернув порожню відповідь або сталася помилка виклику для Job ID: " + jobId);
        }

        // 3. Декодуємо плоский результат
        List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());

        if (results.isEmpty() || results.size() < 11) {
            throw new RuntimeException("Не вдалося розпарсити дані з блокчейну (недостатньо полів) для Job ID: " + jobId);
        }

        // 4. Мапимо розпаковані дані в наш DTO
        return BlockchainJobDto.builder()
                .id(((Uint256) results.get(0)).getValue().longValue())
                .vin(((Utf8String) results.get(1)).getValue())
                .clientAddress(((Address) results.get(2)).getValue())
                .statusIndex(((Uint8) results.get(3)).getValue().intValue())
                .estimatedTotal(((Uint256) results.get(4)).getValue().longValue())
                .depositRequired(((Uint256) results.get(5)).getValue().longValue())
                .cancelReason(((Utf8String) results.get(6)).getValue())
                .requestPdfHash(((Utf8String) results.get(7)).getValue())
                .inspectionPdfHash(((Utf8String) results.get(8)).getValue())
                .workReportPdfHash(((Utf8String) results.get(9)).getValue())
                .receiptPdfHash(((Utf8String) results.get(10)).getValue())
                .build();
    }

    /**
     * Retrieves the entire chronological history of status changes for a specific job
     * safely and synchronously, avoiding Web3j's infinite polling bugs.
     */
    public List<JobHistoryEventDto> getJobHistoryFromBlockchain(Long jobId) throws Exception {
        log.info("Blockchain: Fetching event history for job ID: {}", jobId);

        // 1. Створюємо фільтр для синхронного отримання ВСІХ минулих логів (без зависань)
        org.web3j.protocol.core.methods.request.EthFilter filter = new org.web3j.protocol.core.methods.request.EthFilter(
                DefaultBlockParameterName.EARLIEST,
                DefaultBlockParameterName.LATEST,
                contractAddress
        );

        // 2. Виконуємо один запит до ноди (працює миттєво)
        List<org.web3j.protocol.core.methods.response.EthLog.LogResult> logs = web3j.ethGetLogs(filter).send().getLogs();

        // 3. Збираємо унікальні хеші транзакцій, щоб не робити дубльованих запитів
        java.util.Set<String> uniqueTxHashes = logs.stream()
                .map(logResult -> ((org.web3j.protocol.core.methods.response.Log) logResult.get()).getTransactionHash())
                .collect(Collectors.toSet());

        List<JobHistoryEventDto> historyList = new java.util.ArrayList<>();

        // 4. Для кожної транзакції отримуємо Receipt і парсимо події готовим автогенерованим методом
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

        // 5. Сортуємо події в правильному хронологічному порядку (за номером блоку)
        historyList.sort(java.util.Comparator.comparing(JobHistoryEventDto::getBlockNumber));

        log.info("Successfully found {} history events for Job ID {}", historyList.size(), jobId);
        return historyList;
    }
    /**
     * Retrieves the total number of repair jobs registered in the blockchain smart contract.
     */
    public Long getJobCounter() throws Exception {
        log.info("Blockchain: Fetching current job counter");
        BigInteger counter = contract.jobCounter().send();
        return counter.longValue();
    }
}