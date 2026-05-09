package com.vehicle.service.vehicleserviceapi.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class PdfService {

    private final String STORAGE_PATH = "storage/requests/";

    public String generateAndSaveServiceRequestPdf(String vin, String description, String customerName, Long requestId) {
        try {
            // Створюємо папку, якщо її немає
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(STORAGE_PATH));

            String fileName = "request_" + requestId + ".pdf";
            String fullPath = STORAGE_PATH + fileName;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);

            document.open();
            document.add(new Paragraph("ОФІЦІЙНА ЗАЯВКА НА СТО"));
            document.add(new Paragraph("ID заявки в системі: " + requestId));
            document.add(new Paragraph("VIN: " + vin));
            document.add(new Paragraph("Клієнт: " + customerName));
            document.add(new Paragraph("Опис проблеми: " + description));
            document.add(new Paragraph("Дата створення: " + LocalDateTime.now()));
            document.close();

            byte[] pdfBytes = out.toByteArray();

            // 1. Зберігаємо фізично на диск
            java.nio.file.Files.write(java.nio.file.Paths.get(fullPath), pdfBytes);

            // 2. Рахуємо хеш для блокчейну
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(pdfBytes);
            return HexFormat.of().formatHex(hash);

        } catch (Exception e) {
            throw new RuntimeException("Помилка генерації та збереження PDF", e);
        }
    }
    public String generateAndSaveServiceRequestPdf(String vin, String description, String customerName) {
        try {
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(STORAGE_PATH));

            // Використовуємо час замість requestId для унікальності імені файлу
            String fileName = "req_" + vin + "_" + System.currentTimeMillis() + ".pdf";
            String fullPath = STORAGE_PATH + fileName;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);

            document.open();
            document.add(new Paragraph("ОФІЦІЙНА ЗАЯВКА НА СТО"));
            document.add(new Paragraph("VIN: " + vin));
            document.add(new Paragraph("Клієнт: " + customerName));
            document.add(new Paragraph("Опис проблеми: " + description));
            document.add(new Paragraph("Дата: " + LocalDateTime.now()));
            document.close();

            byte[] pdfBytes = out.toByteArray();
            java.nio.file.Files.write(java.nio.file.Paths.get(fullPath), pdfBytes);

            byte[] hash = MessageDigest.getInstance("SHA-256").digest(pdfBytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Помилка генерації PDF", e);
        }
    }
    public String generateInspectionPdf(String vin, String findings, Long total, Long deposit) {
        try {
            String fileName = "inspection_" + vin + "_" + System.currentTimeMillis() + ".pdf";
            String fullPath = STORAGE_PATH + fileName;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("АКТ ОГЛЯДУ ТА РОЗРАХУНОК ВАРТОСТІ"));
            document.add(new Paragraph("VIN: " + vin));
            document.add(new Paragraph("Результати огляду: " + findings));
            document.add(new Paragraph("Загальна вартість: " + total + " грн"));
            document.add(new Paragraph("Необхідний депозит: " + deposit + " грн"));
            document.add(new Paragraph("Дата: " + LocalDateTime.now()));
            document.close();

            byte[] pdfBytes = out.toByteArray();
            java.nio.file.Files.write(java.nio.file.Paths.get(fullPath), pdfBytes);

            byte[] hash = MessageDigest.getInstance("SHA-256").digest(pdfBytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Помилка генерації акта огляду", e);
        }
    }
    public String generatePaymentReceiptPdf(Long requestId, String vin, Long amount, String paymentMethod) {
        try {
            String fileName = "receipt_" + requestId + "_" + System.currentTimeMillis() + ".pdf";
            String fullPath = STORAGE_PATH + fileName;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("ФІСКАЛЬНИЙ ЧЕК (ДЕПОЗИТ)"));
            document.add(new Paragraph("Заявка №: " + requestId));
            document.add(new Paragraph("VIN: " + vin));
            document.add(new Paragraph("Сума оплати: " + amount + " грн"));
            document.add(new Paragraph("Метод оплати: " + paymentMethod));
            document.add(new Paragraph("Статус: ПІДТВЕРДЖЕНО АДМІНІСТРАТОРОМ"));
            document.add(new Paragraph("Дата: " + LocalDateTime.now()));
            document.close();

            byte[] pdfBytes = out.toByteArray();
            java.nio.file.Files.write(java.nio.file.Paths.get(fullPath), pdfBytes);

            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(pdfBytes));
        } catch (Exception e) {
            throw new RuntimeException("Помилка генерації чека", e);
        }
    }
    public String generateOnlineReceiptPdf(Long requestId, String vin, Long amount, String transactionId) {
        try {
            String fileName = "online_receipt_" + transactionId + ".pdf";
            String fullPath = STORAGE_PATH + fileName;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("ЕЛЕКТРОННА КВИТАНЦІЯ ПРО ОПЛАТУ"));
            document.add(new Paragraph("Заявка №: " + requestId));
            document.add(new Paragraph("VIN: " + vin));
            document.add(new Paragraph("Сума: " + amount + " грн"));
            document.add(new Paragraph("ID транзакції шлюзу: " + transactionId));
            document.add(new Paragraph("Статус: ОПЛАЧЕНО ОНЛАЙН"));
            document.add(new Paragraph("Дата: " + LocalDateTime.now()));
            document.close();

            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(out.toByteArray()));
        } catch (Exception e) {
            throw new RuntimeException("Помилка генерації онлайн-чека", e);
        }
    }
}