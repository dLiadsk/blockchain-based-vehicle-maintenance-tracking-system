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

    // Папка, куди будемо складати документи
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
}