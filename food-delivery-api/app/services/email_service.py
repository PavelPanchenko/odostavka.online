"""
Сервис отправки электронных писем (SMTP)
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
import socket


class EmailService:
    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.user = settings.smtp_user
        self.password = settings.smtp_password
        self.sender = settings.smtp_from or (self.user or "no-reply@example.com")
        self.use_tls = settings.smtp_use_tls
        self.use_ssl = settings.smtp_use_ssl

    def _send(self, to_email: str, subject: str, html: str, text: Optional[str] = None) -> None:
        if not self.host or not self.port or not self.sender:
            # В dev-режиме без SMTP просто логируем
            print(f"[EmailService] DEV fallback: to={to_email}, subject={subject}\n{html}")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.sender
        msg["To"] = to_email

        if text:
            msg.attach(MIMEText(text, "plain", _charset="utf-8"))
        msg.attach(MIMEText(html, "html", _charset="utf-8"))

        # Восстанавливаем доменное имя для SNI в TLS (некоторые провайдеры требуют именно hostname)
        # Если потребуется, можно включить IPv4 резолв отдельно, но по умолчанию используем self.host
        target_host = self.host

        def send_via_ssl() -> None:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(target_host, self.port, context=context, timeout=20) as server:
                server.ehlo()
                if self.user and self.password:
                    server.login(self.user, self.password)
                server.sendmail(self.sender, [to_email], msg.as_string())

        def send_via_starttls() -> None:
            with smtplib.SMTP(target_host, self.port, timeout=20) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                if self.user and self.password:
                    server.login(self.user, self.password)
                server.sendmail(self.sender, [to_email], msg.as_string())

        # Подробное логирование только в debug, пароль маскируем
        if settings.debug:
            print(
                "[EmailService] send:",
                {
                    "host": self.host,
                    "port": self.port,
                    "from": self.sender,
                    "user": self.user,
                    "tls": self.use_tls,
                    "ssl": self.use_ssl,
                }
            )

        # Основной режим из настроек + автоматический фолбэк на альтернативный режим
        try:
            if self.use_ssl:
                send_via_ssl()
            else:
                if self.use_tls:
                    send_via_starttls()
                else:
                    # Без шифрования (не рекомендуется для продакшна), но оставим для совместимости
                    with smtplib.SMTP(target_host, self.port, timeout=20) as server:
                        server.ehlo()
                        if self.user and self.password:
                            server.login(self.user, self.password)
                        server.sendmail(self.sender, [to_email], msg.as_string())
        except Exception as e1:
            # Автоматический фолбэк между 465/SSL и 587/STARTTLS
            if settings.debug:
                print(f"[EmailService] primary mode failed: {e1}")
            try:
                if self.use_ssl:
                    # Пробуем STARTTLS на 587
                    with smtplib.SMTP(target_host, 587, timeout=20) as server:
                        server.ehlo()
                        server.starttls(context=ssl.create_default_context())
                        server.ehlo()
                        if self.user and self.password:
                            server.login(self.user, self.password)
                        server.sendmail(self.sender, [to_email], msg.as_string())
                else:
                    # Пробуем SSL на 465
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(target_host, 465, context=context, timeout=20) as server:
                        server.ehlo()
                        if self.user and self.password:
                            server.login(self.user, self.password)
                        server.sendmail(self.sender, [to_email], msg.as_string())
            except Exception as e2:
                if settings.debug:
                    print(f"[EmailService] fallback mode failed: {e2}")
                # Ретро-лог с минимумом деталей вне debug
                raise

    def send_verification_code(self, to_email: str, code: str) -> None:
        subject = "Подтверждение регистрации"
        html = f"""
        <div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">
          <h2>Подтверждение email</h2>
          <p>Ваш код для подтверждения регистрации:</p>
          <div style=\"font-size: 24px; font-weight: bold; letter-spacing: 4px;\">{code}</div>
          <p>Срок действия кода: {settings.verification_code_ttl_minutes} минут.</p>
          <p>Если вы не запрашивали этот код, проигнорируйте это сообщение.</p>
        </div>
        """
        text = (
            f"Код подтверждения: {code}\n"
            f"Действителен {settings.verification_code_ttl_minutes} минут."
        )
        self._send(to_email, subject, html, text)


    def send_password_reset_code(self, to_email: str, code: str) -> None:
        """Отправка кода для сброса пароля"""
        subject = "Сброс пароля"
        html = f"""
        <div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">
          <h2>Сброс пароля</h2>
          <p>Ваш код для сброса пароля:</p>
          <div style=\"font-size: 24px; font-weight: bold; letter-spacing: 4px;\">{code}</div>
          <p>Срок действия кода: {settings.verification_code_ttl_minutes} минут.</p>
          <p>Если вы не запрашивали сброс пароля, проигнорируйте это сообщение.</p>
        </div>
        """
        text = (
            f"Код для сброса пароля: {code}\n"
            f"Действителен {settings.verification_code_ttl_minutes} минут."
        )
        self._send(to_email, subject, html, text)


