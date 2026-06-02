package com.vehicle.service.vehicleserviceapi.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.vehicle.service.vehicleserviceapi.dto.WorkItem;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.ServiceRequestRepository;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;

/**
 * Enterprise service for generating highly detailed, structured PDF documents.
 * Integrates SHA-256 hashing to ensure document immutability on the blockchain.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PdfService {

    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;

    private static final String STORAGE_PATH = "storage/requests/";
    private static final String FONT_PATH = "src/main/resources/fonts/times.ttf";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Font titleFont;
    private Font headerFont;
    private Font normalFont;
    private Font normalBoldFont;
    private Font smallItalic;

    @PostConstruct
    public void initFonts() {
        try {
            BaseFont baseFont = BaseFont.createFont(FONT_PATH, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            this.titleFont = new Font(baseFont, 18, Font.BOLD, BaseColor.BLACK);
            this.headerFont = new Font(baseFont, 12, Font.BOLD, BaseColor.DARK_GRAY);
            this.normalFont = new Font(baseFont, 10, Font.NORMAL, BaseColor.BLACK);
            this.normalBoldFont = new Font(baseFont, 10, Font.BOLD, BaseColor.BLACK);
            this.smallItalic = new Font(baseFont, 8, Font.ITALIC, BaseColor.GRAY);
            log.info("PDF Fonts initialized successfully with Cyrillic support.");
        } catch (Exception e) {
            log.error("Failed to load embedded fonts. Falling back to default Helvetica.", e);
            this.titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            this.headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            this.normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            this.normalBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            this.smallItalic = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8);
        }
    }

    // ============================================================================
    // DOCUMENT GENERATORS
    // ============================================================================

    public String generateAndSaveServiceRequestPdf(Vehicle vehicle, StoProfile sto, String customerName, String description, Long currentMileage) {
        return generatePdf("Service_Request", vehicle.getVin(), (doc) -> {
            addDocumentHeader(doc, "OFFICIAL SERVICE REQUEST");

            // Section 1: Customer & STO Information
            addSectionTitle(doc, "Customer & Station Information");
            PdfPTable customerTable = createInfoTable();
            addTableRow(customerTable, "Customer Name:", customerName);
            addTableRow(customerTable, "Service Station (STO):", sto.getStationName());
            addTableRow(customerTable, "STO Location:", sto.getCity() + ", " + sto.getAddress());
            doc.add(customerTable);

            // Section 2: Comprehensive Vehicle Details
            addSectionTitle(doc, "Vehicle Details");
            PdfPTable vehicleTable = createInfoTable();
            addTableRow(vehicleTable, "VIN:", vehicle.getVin());
            addTableRow(vehicleTable, "Make & Model:", vehicle.getBrand() + " " + vehicle.getModel());
            addTableRow(vehicleTable, "Manufacturing Year:", String.valueOf(vehicle.getYear()));
            addTableRow(vehicleTable, "License Plate:", vehicle.getNumber() != null ? vehicle.getNumber() : "Not specified");
            addTableRow(vehicleTable, "Current Mileage:", currentMileage != null ? currentMileage + " km" : "Not specified");
            doc.add(vehicleTable);

            // Section 3: Issue Description
            addSectionTitle(doc, "Reported Issue / Description");
            doc.add(new Paragraph(description, normalFont));
        });
    }

    public String generateInspectionPdf(String vin, String findings, Long total, Long deposit, List<String> workTypes) {
        return generatePdf("Inspection_Report", vin, (doc) -> {
            addDocumentHeader(doc, "TECHNICAL INSPECTION & ESTIMATION");

            PdfPTable infoTable = createInfoTable();
            addTableRow(infoTable, "Vehicle VIN:", vin);
            addTableRow(infoTable, "Estimated Total Cost:", total + " UAH");
            addTableRow(infoTable, "Required Deposit:", deposit + " UAH");
            doc.add(infoTable);

            addSectionTitle(doc, "Diagnostic Findings");
            doc.add(new Paragraph(findings, normalFont));

            if (workTypes != null && !workTypes.isEmpty()) {
                addSectionTitle(doc, "Confirmed Work Types");
                com.itextpdf.text.List list = new com.itextpdf.text.List(com.itextpdf.text.List.UNORDERED);
                workTypes.forEach(work -> list.add(new ListItem(work, normalFont)));
                doc.add(list);
            }
        });
    }

    public String generatePaymentReceiptPdf(Long requestId, String vin, Long amount, String paymentMethod) {
        return generatePdf("Deposit_Receipt", vin, (doc) -> {
            addDocumentHeader(doc, "FISCAL RECEIPT (DEPOSIT)");

            PdfPTable infoTable = createInfoTable();
            addTableRow(infoTable, "Global Request ID:", String.valueOf(requestId));
            addTableRow(infoTable, "Vehicle VIN:", vin);
            addTableRow(infoTable, "Amount Paid:", amount + " UAH");
            addTableRow(infoTable, "Payment Method:", paymentMethod);
            addTableRow(infoTable, "Payment Status:", "CONFIRMED BY ADMINISTRATOR");
            doc.add(infoTable);
        });
    }

    public String generateOnlineReceiptPdf(Long requestId, String vin, Long amount, String transactionId) {
        return generatePdf("Online_Receipt", vin, (doc) -> {
            addDocumentHeader(doc, "ELECTRONIC PAYMENT RECEIPT");

            PdfPTable infoTable = createInfoTable();
            addTableRow(infoTable, "Global Request ID:", String.valueOf(requestId));
            addTableRow(infoTable, "Vehicle VIN:", vin);
            addTableRow(infoTable, "Amount Paid:", amount + " UAH");
            addTableRow(infoTable, "Gateway Transaction ID:", transactionId);
            addTableRow(infoTable, "Payment Status:", "SUCCESSFULLY PROCESSED ONLINE");
            doc.add(infoTable);
        });
    }

    public String generateWorkReportPdf(String vin, List<WorkItem> items, Long finalTotal, String mechanic) {
        return generatePdf("Work_Report", vin, (doc) -> {
            addDocumentHeader(doc, "ACT OF COMPLETED WORKS AND PARTS");

            PdfPTable infoTable = createInfoTable();
            addTableRow(infoTable, "Vehicle VIN:", vin);
            addTableRow(infoTable, "Responsible Mechanic:", mechanic != null && !mechanic.isEmpty() ? mechanic : "Not specified");
            doc.add(infoTable);

            addSectionTitle(doc, "Itemized Services and Parts");
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 1f, 2f, 2f});

            addTableHeader(table, "Description", "Qty", "Unit Price", "Total");

            for (WorkItem item : items) {
                table.addCell(createCell(item.getDescription(), normalFont));
                table.addCell(createCell(String.valueOf(item.getQuantity()), normalFont));
                table.addCell(createCell(item.getUnitPrice() + " UAH", normalFont));
                table.addCell(createCell(item.getTotalPrice() + " UAH", normalBoldFont));
            }
            doc.add(table);

            doc.add(new Paragraph(" "));
            Paragraph totalRow = new Paragraph("FINAL TOTAL AMOUNT DUE: " + finalTotal + " UAH", headerFont);
            totalRow.setAlignment(Element.ALIGN_RIGHT);
            doc.add(totalRow);
        });
    }

    public String generateFinalReceiptPdf(Long requestId, String vin, Long total, Long deposit) {
        return generatePdf("Final_Settlement", vin, (doc) -> {
            addDocumentHeader(doc, "FINAL SETTLEMENT RECEIPT");

            PdfPTable infoTable = createInfoTable();
            addTableRow(infoTable, "Global Request ID:", String.valueOf(requestId));
            addTableRow(infoTable, "Vehicle VIN:", vin);
            doc.add(infoTable);

            addSectionTitle(doc, "Financial Summary");
            PdfPTable financeTable = createInfoTable();
            addTableRow(financeTable, "Total Service Cost:", total + " UAH");
            addTableRow(financeTable, "Previously Paid (Deposit):", "- " + deposit + " UAH");
            addTableRow(financeTable, "Balance Paid at Pickup:", (total - deposit) + " UAH");
            doc.add(financeTable);

            Paragraph status = new Paragraph("STATUS: FULLY PAID AND SETTLED", titleFont);
            status.setAlignment(Element.ALIGN_CENTER);
            status.setSpacingBefore(20);
            doc.add(status);
        });
    }

    // ============================================================================
    // FILE RETRIEVAL & SECURITY
    // ============================================================================

    public Resource downloadDocument(Long id, String docType, String currentUserEmail) throws IOException {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service request not found in the database."));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user profile not found."));

        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());
        boolean isAssignedSto = currentUser.getStoProfile() != null &&
                request.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());
        boolean isAdmin = currentUser.getRole().equals(UserRole.ROLE_ADMIN);

        if (!isOwner && !isAssignedSto && !isAdmin) {
            log.warn("Unauthorized document access attempt by user: {} for request ID: {}", currentUserEmail, id);
            throw new RuntimeException("Access denied: You are not authorized to view this document.");
        }

        String filePrefix = docType.toLowerCase();
        String expectedHash = switch (filePrefix) {
            case "service_request" -> request.getPdfHash();
            case "inspection_report" -> request.getInspectionPdfHash();
            case "deposit_receipt", "online_receipt" -> request.getPaymentReceiptPdfHash();
            case "work_report" -> request.getWorkReportPdfHash();
            case "final_settlement" -> request.getFinalReceiptPdfHash();
            default -> throw new RuntimeException("Unknown document type requested: " + docType);
        };

        if (expectedHash == null || expectedHash.isEmpty()) {
            throw new RuntimeException("The requested document has not been generated yet.");
        }

        String vin = request.getVehicle().getVin();
        String exactFileName = filePrefix + "_" + expectedHash + ".pdf";
        Path filePath = Paths.get(STORAGE_PATH + vin + "/" + exactFileName);

        // Fallback logic for receipts (could be named online or offline)
        if ((filePrefix.equals("deposit_receipt") || filePrefix.equals("online_receipt")) && !Files.exists(filePath)) {
            String alternativePrefix = filePrefix.equals("deposit_receipt") ? "online_receipt" : "deposit_receipt";
            exactFileName = alternativePrefix + "_" + expectedHash + ".pdf";
            filePath = Paths.get(STORAGE_PATH + vin + "/" + exactFileName);
        }

        if (!Files.exists(filePath)) {
            log.error("File physical missing on disk. Expected path: {}", filePath);
            throw new RuntimeException("File physically missing from storage directory.");
        }

        return new UrlResource(filePath.toUri());
    }

    // ============================================================================
    // INTERNAL PDF UTILITIES & FORMATTING
    // ============================================================================

    private void addDocumentHeader(Document doc, String titleText) throws DocumentException {
        Paragraph title = new Paragraph(titleText, titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph subTitle = new Paragraph("System Generated Official Record", smallItalic);
        subTitle.setAlignment(Element.ALIGN_CENTER);
        subTitle.setSpacingAfter(15);
        doc.add(subTitle);
    }

    private void addSectionTitle(Document doc, String title) throws DocumentException {
        doc.add(new Paragraph(" "));
        Paragraph p = new Paragraph(title.toUpperCase(), headerFont);
        p.setSpacingAfter(5);
        doc.add(p);
        doc.add(new Chunk(new LineSeparator(0.5f, 100, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, -2)));
        doc.add(new Paragraph(" "));
    }

    private PdfPTable createInfoTable() {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        try {
            table.setWidths(new float[]{3f, 7f});
        } catch (DocumentException e) {
            log.error("Failed to set table widths", e);
        }
        return table;
    }

    private void addTableRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, normalBoldFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingBottom(8);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, normalFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingBottom(8);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(new BaseColor(240, 240, 240)); // Light subtle gray
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(8);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private String generatePdf(String prefix, String vin, PdfContent filler) {
        String vehicleDirectory = STORAGE_PATH + vin + "/";

        try {
            Files.createDirectories(Paths.get(vehicleDirectory));
            Document document = new Document(PageSize.A4, 50, 50, 50, 50); // Standard margins
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, out);

            document.open();

            // Execute the specific document filler logic
            filler.fill(document);

            // Standard Footer with Metadata
            document.add(new Paragraph(" "));
            document.add(new Chunk(new LineSeparator(1f, 100, BaseColor.DARK_GRAY, Element.ALIGN_CENTER, -2)));

            Paragraph footer = new Paragraph("CRYPTOGRAPHIC INTEGRITY WARNING:", normalBoldFont);
            footer.setSpacingBefore(10);
            document.add(footer);

            document.add(new Paragraph("This document's SHA-256 hash is permanently recorded on the decentralized blockchain. Any unauthorized modification to this file will invalidate its cryptographic signature.", smallItalic));
            document.add(new Paragraph("Generated at: " + LocalDateTime.now().format(FORMATTER), smallItalic));

            document.close();

            byte[] pdfBytes = out.toByteArray();
            String hash = calculateHash(pdfBytes);

            String fileName = prefix.toLowerCase() + "_" + hash + ".pdf";
            String fullPath = vehicleDirectory + fileName;

            Files.write(Paths.get(fullPath), pdfBytes);

            log.info("Successfully generated PDF: {} with Hash: {}", fileName, hash);
            return hash;

        } catch (Exception e) {
            log.error("PDF generation failed for prefix {}: {}", prefix, e.getMessage(), e);
            throw new RuntimeException("Error generating internal document. Please contact support.");
        }
    }

    private String calculateHash(byte[] data) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(data);
        return HexFormat.of().formatHex(hash);
    }

    public String calculateFileHash(Path filePath) throws Exception {
        byte[] data = Files.readAllBytes(filePath);
        return calculateHash(data);
    }

    @FunctionalInterface
    private interface PdfContent {
        void fill(Document doc) throws Exception;
    }
}