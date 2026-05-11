package com.vehicle.service.vehicleserviceapi.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.vehicle.service.vehicleserviceapi.dto.WorkItem;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;

/**
 * Service for generating professional PDF documents in English.
 * Integrates SHA-256 hashing for blockchain-based integrity verification.
 */
@Service
@Slf4j
public class PdfService {

    private final String STORAGE_PATH = "storage/requests/";
    private final String FONT_PATH = "src/main/resources/fonts/times.ttf";
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Font titleFont;
    private Font headerFont;
    private Font normalFont;
    private Font smallItalic;

    @PostConstruct
    public void initFonts() {
        try {
            BaseFont baseFont = BaseFont.createFont(FONT_PATH, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            this.titleFont = new Font(baseFont, 18, Font.BOLD, BaseColor.BLACK);
            this.headerFont = new Font(baseFont, 12, Font.BOLD, BaseColor.DARK_GRAY);
            this.normalFont = new Font(baseFont, 10, Font.NORMAL, BaseColor.BLACK);
            this.smallItalic = new Font(baseFont, 8, Font.ITALIC, BaseColor.GRAY);
            log.info("PDF Fonts initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to load fonts. Falling back to Helvetica.");
            this.titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            this.headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            this.normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            this.smallItalic = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8);
        }
    }

    // --- 1. Service Request PDF ---
    public String generateAndSaveServiceRequestPdf(String vin, String description, String customerName) {
        return generatePdf("Service_Request", vin, (doc) -> {
            addTitle(doc, "OFFICIAL SERVICE REQUEST");
            addInfoRow(doc, "Customer:", customerName);
            addInfoRow(doc, "Vehicle VIN:", vin);
            addInfoRow(doc, "Issue Description:", description);
        });
    }

    // --- 2. Inspection Report PDF ---
    public String generateInspectionPdf(String vin, String findings, Long total, Long deposit) {
        return generatePdf("Inspection_Report", vin, (doc) -> {
            addTitle(doc, "TECHNICAL INSPECTION & COST ESTIMATION");
            addInfoRow(doc, "Vehicle VIN:", vin);
            addInfoRow(doc, "Technical Findings:", findings);
            doc.add(new Chunk(new LineSeparator()));
            addInfoRow(doc, "Estimated Total Cost:", total + " UAH");
            addInfoRow(doc, "Required Deposit:", deposit + " UAH");
        });
    }

    // --- 3. Offline Payment Receipt (Deposit) ---
    public String generatePaymentReceiptPdf(Long requestId, String vin, Long amount, String paymentMethod) {
        return generatePdf("Deposit_Receipt", vin, (doc) -> {
            addTitle(doc, "FISCAL RECEIPT (DEPOSIT)");
            addInfoRow(doc, "Request ID:", String.valueOf(requestId));
            addInfoRow(doc, "Vehicle VIN:", vin);
            addInfoRow(doc, "Amount Paid:", amount + " UAH");
            addInfoRow(doc, "Payment Method:", paymentMethod);
            addInfoRow(doc, "Status:", "CONFIRMED BY ADMINISTRATOR");
        });
    }

    // --- 4. Online Payment Receipt ---
    public String generateOnlineReceiptPdf(Long requestId, String vin, Long amount, String transactionId) {
        return generatePdf("Online_Receipt", vin, (doc) -> {
            addTitle(doc, "ELECTRONIC PAYMENT RECEIPT");
            addInfoRow(doc, "Request ID:", String.valueOf(requestId));
            addInfoRow(doc, "Vehicle VIN:", vin);
            addInfoRow(doc, "Amount:", amount + " UAH");
            addInfoRow(doc, "Gateway Transaction ID:", transactionId);
            addInfoRow(doc, "Status:", "PAID ONLINE");
        });
    }

    // --- 5. Work Report (Final Act) ---
    public String generateWorkReportPdf(String vin, List<WorkItem> items, Long finalTotal) {
        return generatePdf("Work_Report", vin, (doc) -> {
            addTitle(doc, "ACT OF COMPLETED WORKS AND PARTS");
            addInfoRow(doc, "Vehicle VIN:", vin);
            doc.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            addTableHeader(table, "Description", "Qty", "Unit Price", "Total");

            for (WorkItem item : items) {
                table.addCell(createCell(item.getDescription(), normalFont));
                table.addCell(createCell(String.valueOf(item.getQuantity()), normalFont));
                table.addCell(createCell(item.getUnitPrice() + " UAH", normalFont));
                table.addCell(createCell(item.getTotalPrice() + " UAH", normalFont));
            }
            doc.add(table);

            doc.add(new Paragraph(" "));
            addInfoRow(doc, "TOTAL AMOUNT DUE:", finalTotal + " UAH");
        });
    }

    // --- 6. Final Receipt ---
    public String generateFinalReceiptPdf(Long requestId, String vin, Long total, Long deposit) {
        return generatePdf("Final_Settlement", vin, (doc) -> {
            addTitle(doc, "FINAL SETTLEMENT RECEIPT");
            addInfoRow(doc, "Request ID:", String.valueOf(requestId));
            addInfoRow(doc, "Vehicle VIN:", vin);
            doc.add(new Chunk(new LineSeparator()));
            addInfoRow(doc, "Total Service Cost:", total + " UAH");
            addInfoRow(doc, "Previously Paid (Deposit):", deposit + " UAH");
            addInfoRow(doc, "Balance Paid at Pickup:", (total - deposit) + " UAH");
            doc.add(new Paragraph("STATUS: FULLY PAID", headerFont));
        });
    }

    // --- Core PDF Generation Logic ---

    private void addTitle(Document doc, String text) throws DocumentException {
        Paragraph p = new Paragraph(text, titleFont);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(20);
        doc.add(p);
    }

    private void addInfoRow(Document doc, String label, String value) throws DocumentException {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " ", headerFont));
        p.add(new Chunk(value, normalFont));
        p.setSpacingAfter(5);
        doc.add(p);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        return cell;
    }

    private String generatePdf(String prefix, String vin, PdfContent filler) {
        String fileName = prefix.toLowerCase() + "_" + vin + "_" + System.currentTimeMillis() + ".pdf";
        String fullPath = STORAGE_PATH + fileName;

        try {
            Files.createDirectories(Paths.get(STORAGE_PATH));
            Document document = new Document();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);

            document.open();
            filler.fill(document);

            // Footer with Blockchain and Timestamp info
            document.add(new Paragraph(" "));
            document.add(new Chunk(new LineSeparator()));
            Paragraph footer = new Paragraph("This document is protected by a SHA-256 cryptographic hash and recorded on the blockchain ledger for integrity assurance.", smallItalic);
            footer.add(new Paragraph("Generation Date: " + LocalDateTime.now().format(formatter), smallItalic));
            document.add(footer);

            document.close();

            byte[] pdfBytes = out.toByteArray();
            Files.write(Paths.get(fullPath), pdfBytes);

            return calculateHash(pdfBytes);
        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage());
            throw new RuntimeException("Error generating document: " + prefix);
        }
    }

    private String calculateHash(byte[] data) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(data);
        return HexFormat.of().formatHex(hash);
    }

    @FunctionalInterface
    private interface PdfContent {
        void fill(Document doc) throws Exception;
    }
}