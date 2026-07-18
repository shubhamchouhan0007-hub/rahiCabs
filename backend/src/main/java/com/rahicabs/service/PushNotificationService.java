package com.rahicabs.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.rahicabs.entity.Customer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Sends Firebase Cloud Messaging pushes to customers' mobile devices.
 * Safe no-op when Firebase isn't configured or the customer has no device token.
 */
@Service
@Slf4j
public class PushNotificationService {

    public void sendToCustomer(Customer customer, String title, String body) {
        if (customer == null) return;
        String token = customer.getFcmToken();
        if (token == null || token.isBlank()) return;
        try {
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .build();
            FirebaseMessaging.getInstance().send(message);
            log.info("Push sent to customer {}: {}", customer.getId(), title);
        } catch (Exception e) {
            log.warn("Push to customer {} failed: {}", customer.getId(), e.getMessage());
        }
    }
}
