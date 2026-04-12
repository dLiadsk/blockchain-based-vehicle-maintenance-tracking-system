package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.contracts.VehicleService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;


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

            // РЕАЛЬНА ПЕРЕВІРКА: запитуємо версію клієнта
            String clientVersion = web3j.web3ClientVersion().send().getWeb3ClientVersion();

            Credentials credentials = Credentials.create(adminPrivateKey);
            this.contract = VehicleService.load(contractAddress, web3j, credentials, new DefaultGasProvider());

            log.info("--- Блокчейн-сервіс успішно ініціалізовано ---");
            log.info("Підключено до: {}", clientVersion);
        } catch (Exception e) {
            log.error("ПОМИЛКА: Не вдалося підключитися до Hardhat! Переконайтеся, що 'npx hardhat node' запущено.");
            // Можна навіть зупинити додаток, якщо блокчейн критично важливий
            // throw new RuntimeException("Blockchain connection failed");
        }
    }

    /**
     * Реєстрація автомобіля в блокчейні (СТО платить за газ)
     */
    public String registerVehicle(String vin, String passportHash) throws Exception {
        log.info("Реєстрація авто з VIN: {}", vin);

        // Викликаємо функцію смарт-контракту
        var receipt = contract.registerVehicle(vin, passportHash).send();

        log.info("Транзакція успішна! Hash: {}", receipt.getTransactionHash());
        return receipt.getTransactionHash();
    }
}