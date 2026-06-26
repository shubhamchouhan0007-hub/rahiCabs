package com.rahicabs.service;

import com.rahicabs.entity.AppSetting;
import com.rahicabs.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private final AppSettingRepository repo;

    public String get(String key, String defaultValue) {
        return repo.findById(key).map(AppSetting::getValue).orElse(defaultValue);
    }

    public double getDouble(String key, double defaultValue) {
        try { return Double.parseDouble(get(key, String.valueOf(defaultValue))); }
        catch (NumberFormatException e) { return defaultValue; }
    }

    public void set(String key, String value) {
        repo.save(new AppSetting(key, value));
    }

    public Map<String, String> getAll() {
        Map<String, String> map = new HashMap<>();
        repo.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return map;
    }

    public void setAll(Map<String, String> settings) {
        settings.forEach((k, v) -> repo.save(new AppSetting(k, v)));
    }
}
