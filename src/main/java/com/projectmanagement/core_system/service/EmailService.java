package com.projectmanagement.core_system.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Sends account credentials to a new user.
     * 
     * @param toEmail  The recipient's email
     * @param fullName The recipient's full name
     * @param password The generated or set password
     */
    @Async
    public void sendCredentialsEmail(String toEmail, String fullName, String password) {
        log.info("Preparing to send credentials email to: {}", toEmail);

        String subject = "Chào mừng bạn đến với Hệ thống Quản lý Dự án";
        String content = String.format(
                "<html>" +
                        "<body>" +
                        "<h2>Xin chào %s,</h2>" +
                        "<p>Tài khoản của bạn đã được tạo thành công trên Hệ thống Quản lý Dự án.</p>" +
                        "<p>Dưới đây là thông tin đăng nhập của bạn:</p>" +
                        "<ul>" +
                        "  <li><strong>Email:</strong> %s</li>" +
                        "  <li><strong>Mật khẩu:</strong> %s</li>" +
                        "</ul>" +
                        "<p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức để bảo mật tài khoản.</p>" +
                        "<br/>" +
                        "<p>Trân trọng,<br/>Đội ngũ Quản trị</p>" +
                        "</body>" +
                        "</html>",
                fullName, toEmail, password);

        sendHtmlEmail(toEmail, subject, content);
    }

    /**
     * Sends a password change confirmation email.
     */
    @Async
    public void sendPasswordChangeNotification(String toEmail, String fullName) {
        log.info("Preparing to send password change notification to: {}", toEmail);

        String subject = "Thông báo: Mật khẩu của bạn đã được thay đổi";
        String content = String.format(
                "<html>" +
                        "<body>" +
                        "<h2>Xin chào %s,</h2>" +
                        "<p>Thông báo này được gửi để xác nhận rằng mật khẩu cho tài khoản <strong>%s</strong> của bạn vừa mới được thay đổi.</p>"
                        +
                        "<p>Nếu bạn không thực hiện thay đổi này, hãy liên hệ với quản trị viên ngay lập tức.</p>" +
                        "<br/>" +
                        "<p>Trân trọng,<br/>Đội ngũ Quản trị</p>" +
                        "</body>" +
                        "</html>",
                fullName, toEmail);

        sendHtmlEmail(toEmail, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully sent email to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}. Error: {}", to, e.getMessage());
            // We don't throw exception here to avoid breaking the main transaction
        } catch (Exception e) {
            log.error("Unexpected error while sending email to: {}. Error: {}", to, e.getMessage());
        }
    }
}
