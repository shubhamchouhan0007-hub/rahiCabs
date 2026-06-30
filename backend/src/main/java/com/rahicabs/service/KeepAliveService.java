package com.rahicabs.service;

import com.rahicabs.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Keeps the database (and pooled connections) warm so the first real request
 * after an idle period doesn't pay a cold-start penalty. Runs a tiny query on
 * a fixed interval — shorter than the DB's idle-suspend window.
 *
 * Enabled only in production (app.keepalive.enabled=true).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KeepAliveService {

    private final AppSettingRepository appSettingRepository;

    @Value("${app.keepalive.enabled:false}")
    private boolean enabled;

    // fixedRateString lets us tune the interval via config; default 4 min
    @Scheduled(fixedRateString = "${app.keepalive.interval-ms:240000}")
    public void warm() {
        if (!enabled) return;
        try {
            appSettingRepository.count(); // lightweight DB touch keeps Neon awake
            log.debug("Keep-alive ping ok");
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
