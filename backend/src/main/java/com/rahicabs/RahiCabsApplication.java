package com.rahicabs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RahiCabsApplication {
    public static void main(String[] args) {
        SpringApplication.run(RahiCabsApplication.class, args);
    }
}
