package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.contracts.VehicleService;
import com.vehicle.service.vehicleserviceapi.dto.BlockchainResult;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;


@Slf4j
@Service
public class BlockchainService {

    private VehicleService contract;

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${blockchain.admin-private-key}")
    private String adminPrivateKey;

    @Value("${blockchain.contract-address}")
    private String contractAddress;

    @PostConstruct
    public void init() {
        try {
            Web3j web3j = Web3j.build(new HttpService(rpcUrl));

            String clientVersion = web3j.web3ClientVersion().send().getWeb3ClientVersion();

            Credentials credentials = Credentials.create(adminPrivateKey);
            this.contract = VehicleService.load(contractAddress, web3j, credentials, new DefaultGasProvider());

            log.info("--- Блокчейн-сервіс успішно ініціалізовано ---");
            log.info("Підключено до: {}", clientVersion);
        } catch (Exception e) {
            log.error("ПОМИЛКА: Не вдалося підключитися до Hardhat! Переконайтеся, що 'npx hardhat node' запущено.");

        }
    }

    /**
     * Реєстрація автомобіля в блокчейні (СТО платить за газ)
     */
    public String registerVehicle(String vin, String passportHash) throws Exception {
        log.info("Реєстрація авто з VIN: {}", vin);

        var receipt = contract.registerVehicle(vin, passportHash).send();

        log.info("Транзакція успішна! Hash: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }


    public BlockchainResult createServiceRequest(String vin, String pdfHash) throws Exception {
        log.info("Реєстрація заявки в блокчейні для VIN: {}", vin);

        TransactionReceipt receipt = contract.createRequest(vin, pdfHash).send();

        var events = contract.getStatusChangedEvents(receipt);
        if (events.isEmpty()) {
            throw new RuntimeException("Блокчейн не повернув jobId (івент не знайдено)");
        }

        Long jobId = events.get(0).jobId.longValue();
        String txHash = receipt.getTransactionHash();

        return new BlockchainResult(jobId, txHash);
    }

    public String adminApprove(Long jobId) throws Exception {
        log.info("СТО підтверджує заявку в блокчейні. Job ID: {}", jobId);
        TransactionReceipt receipt = contract.adminApprove(BigInteger.valueOf(jobId)).send();
        return receipt.getTransactionHash();
    }
    public String markArrival(Long jobId) throws Exception {
        log.info("СТО фіксує прибуття автомобіля для замовлення №{}", jobId);

        TransactionReceipt receipt = contract.markArrival(BigInteger.valueOf(jobId)).send();

        return receipt.getTransactionHash();
    }
    public String setInspectionResult(Long jobId, Long total, Long deposit, String pdfHash) throws Exception {
        log.info("Фіксація результатів огляду в блокчейні для Job ID: {}", jobId);

        TransactionReceipt receipt = contract.setInspectionResult(
                BigInteger.valueOf(jobId),
                BigInteger.valueOf(total),
                BigInteger.valueOf(deposit),
                pdfHash
        ).send();

        return receipt.getTransactionHash();
    }
    public String confirmDepositPaid(Long jobId, String receiptHash) throws Exception {
        log.info("Адмін підтверджує оплату депозиту для Job ID: {}", jobId);

        TransactionReceipt receipt = contract.confirmDepositPaid(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();

        return receipt.getTransactionHash();
    }
    public String payDepositOnline(Long jobId, String receiptHash) throws Exception {
        log.info("Виклик блокчейну: онлайн-оплата депозиту для Job ID: {}", jobId);
        TransactionReceipt receipt = contract.payDepositOnline(
                BigInteger.valueOf(jobId),
                receiptHash
        ).send();

        log.info("Транзакція онлайн-оплати успішна: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }
}