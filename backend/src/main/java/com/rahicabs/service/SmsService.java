package com.rahicabs.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class SmsService {

    @Value("${app.sms.msg91.authkey:}")
    private String authKey;

    @Value("${app.sms.msg91.sender-id:RAHICB}")
    private String senderId;

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

    private boolean isConfigured() {
        return smsEnabled
            && authKey != null && !authKey.isBlank()
            && !authKey.startsWith("YOUR");
    }

    @Async
    public void send(String phone, String message) {
        if (!isConfigured()) {
            log.info("[SMS-LOG] To: {} | Msg: {}", phone, message);
            return;
        }
        try {
            RestTemplate rest = new RestTemplate();
            String mobile = phone.startsWith("91") ? phone : "91" + phone;

            // MSG91 transactional route-4 (no template needed for dev/testing)
            String url = "https://api.msg91.com/api/v2/sendsms";
            String body = "{"
                + "\"sender\":\"" + senderId + "\","
                + "\"route\":\"4\","
                + "\"country\":\"91\","
                + "\"sms\":[{\"message\":\"" + message.replace("\"", "'") + "\","
                + "\"to\":[\"" + mobile + "\"]}]}";

            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", authKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> res = rest.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            log.info("SMS sent to {}: {}", phone, res.getBody());
        } catch (Exception e) {
            log.error("SMS failed to {}: {}", phone, e.getMessage());
        }
    }
}
