package com.rahicabs.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:noreply@rahicab.com}")
    private String fromAddress;

    @Value("${app.email.from-name:RahiCab}")
    private String fromName;

    @Async
    public void send(String to, String subject, String htmlBody) {
        if (!emailEnabled || to == null || to.isBlank()) {
            log.info("[EMAIL-LOG] To: {} | Subject: {}", to, subject);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromAddress, fromName);
            h.setTo(to);
            h.setSubject(subject);
            h.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("Email failed to {}: {}", to, e.getMessage());
        }
    }

    // ── HTML template helper ──────────────────────────────────────────────────

    public static String wrap(String title, String body) {
        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8">
            <style>
              body{font-family:Arial,sans-serif;background:#f8f6f0;margin:0;padding:0}
              .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:12px;
                    overflow:hidden;box-shadow:0 4px 20px rgba(26,31,78,.1)}
              .hdr{background:linear-gradient(135deg,#1a1f4e,#2a306e);padding:28px 32px}
              .hdr h1{color:#fff;margin:0;font-size:1.3rem;font-weight:800}
              .hdr p{color:#b8c8e8;margin:4px 0 0;font-size:.88rem}
              .body{padding:28px 32px}
              .row{display:flex;justify-content:space-between;padding:10px 0;
                   border-bottom:1px solid #e8e0d0;font-size:.9rem}
              .row span:first-child{color:#6b7280}
              .row span:last-child{font-weight:600;color:#1e293b}
              .chip{display:inline-block;padding:4px 12px;border-radius:100px;
                    font-size:.78rem;font-weight:700}
              .chip-warning{background:#fffbeb;color:#92400e}
              .chip-success{background:#f0fdf4;color:#166534}
              .chip-info{background:#eff6ff;color:#1d4ed8}
              .msg-box{background:#f8f6f0;border-left:4px solid #c9841a;
                       padding:14px 16px;border-radius:0 8px 8px 0;margin:16px 0;
                       font-size:.9rem;color:#374151;line-height:1.6}
              .btn{display:inline-block;background:#1a1f4e;color:#fff;
                   padding:12px 28px;border-radius:8px;text-decoration:none;
                   font-weight:700;font-size:.9rem;margin-top:16px}
              .ftr{background:#f0ece0;padding:16px 32px;text-align:center;
                   font-size:.78rem;color:#9ca3af}
            </style></head>
            <body>
            <div class="wrap">
              <div class="hdr">
                <h1>🚕 RahiCab</h1>
                <p>%s</p>
              </div>
              <div class="body">%s</div>
              <div class="ftr">© RahiCab · Safe &amp; Reliable Cab Service across Bihar</div>
            </div>
            </body></html>
            """.formatted(title, body);
    }
}
