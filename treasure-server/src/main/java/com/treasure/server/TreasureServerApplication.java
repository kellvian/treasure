package com.treasure.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@MapperScan("com.treasure.server.mapper")
public class TreasureServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TreasureServerApplication.class, args);
    }
} 