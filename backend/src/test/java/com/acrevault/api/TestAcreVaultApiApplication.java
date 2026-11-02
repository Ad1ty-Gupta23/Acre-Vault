package com.acrevault.api;

import org.springframework.boot.SpringApplication;

// Runs the API against a throwaway MongoDB container: ./mvnw spring-boot:test-run
public class TestAcreVaultApiApplication {

    public static void main(String[] args) {
        SpringApplication.from(AcreVaultApiApplication::main).with(TestcontainersConfiguration.class).run(args);
    }
}
