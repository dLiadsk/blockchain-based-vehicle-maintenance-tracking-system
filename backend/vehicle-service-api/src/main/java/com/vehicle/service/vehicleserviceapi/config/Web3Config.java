package com.vehicle.service.vehicleserviceapi.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

/**
 * Configuration class for Web3j connection.
 * Facilitates the connection to the blockchain network via RPC.
 */
@Configuration
@Slf4j
public class Web3Config {

    @Value("${blockchain.rpc-url}")
    private String rpcUrl;

    /**
     * Creates a Web3j bean to interact with the blockchain node.
     *
     * @return Web3j instance connected to the specified RPC URL.
     */
    @Bean
    public Web3j web3j() {
        log.info("Initializing Web3j connection to RPC URL: {}", rpcUrl);

        try {
            // Build the Web3j instance using the provided HTTP RPC Service
            return Web3j.build(new HttpService(rpcUrl));
        } catch (Exception e) {
            log.error("Failed to initialize Web3j: {}", e.getMessage());
            throw new RuntimeException("Blockchain connection error", e);
        }
    }
}