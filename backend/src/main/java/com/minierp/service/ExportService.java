package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Excel export service using Apache POI.
 * Fulfills the "Extras: AOP for audit logs, WebSocket (live updates), Apache POI/iText for export"
 * requirement from the tech stack.
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final ProductRepository productRepository;
    private final SalesOrderRepository soRepository;
    private final PurchaseOrderRepository poRepository;
    private final ManufacturingOrderRepository moRepository;
    private final StockLedgerRepository stockLedgerRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Export full inventory report as .xlsx
     */
    public byte[] exportInventoryReport() throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {

            // ── Sheet 1: Products & Stock ──────────────────────────────────
            Sheet productSheet = wb.createSheet("Products & Stock");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);

            String[] productHeaders = {"Ref", "Name", "Category", "On Hand", "Reserved",
                    "Free to Use", "Stock Status", "Sales Price (₹)", "Cost Price (₹)",
                    "Procurement Method", "Procure on Demand"};
            createHeaderRow(productSheet, productHeaders, headerStyle);

            List<Product> products = productRepository.findAll();
            int row = 1;
            for (Product p : products) {
                Row r = productSheet.createRow(row++);
                r.createCell(0).setCellValue(p.getRef());
                r.createCell(1).setCellValue(p.getName());
                r.createCell(2).setCellValue(p.getCategory() != null ? p.getCategory() : "");
                r.createCell(3).setCellValue(p.getOnHandQty());
                r.createCell(4).setCellValue(p.getReservedQty());
                r.createCell(5).setCellValue(p.getFreeToUseQty());
                r.createCell(6).setCellValue(p.getStockStatus());
                Cell spCell = r.createCell(7);
                spCell.setCellValue(p.getSalesPrice().doubleValue());
                spCell.setCellStyle(currencyStyle);
                Cell cpCell = r.createCell(8);
                cpCell.setCellValue(p.getCostPrice().doubleValue());
                cpCell.setCellStyle(currencyStyle);
                r.createCell(9).setCellValue(p.getProcurementMethod() != null ? p.getProcurementMethod().name() : "");
                r.createCell(10).setCellValue(p.isProcureOnDemand() ? "Yes" : "No");
            }
            autoSizeColumns(productSheet, productHeaders.length);

            // ── Sheet 2: Sales Orders ──────────────────────────────────────
            Sheet soSheet = wb.createSheet("Sales Orders");
            String[] soHeaders = {"Ref", "Customer", "Status", "Created", "Schedule Date", "Lines"};
            createHeaderRow(soSheet, soHeaders, headerStyle);
            row = 1;
            for (SalesOrder so : soRepository.findAll()) {
                Row r = soSheet.createRow(row++);
                r.createCell(0).setCellValue(so.getRef());
                r.createCell(1).setCellValue(so.getCustomer().getName());
                r.createCell(2).setCellValue(so.getStatus().name());
                r.createCell(3).setCellValue(so.getCreationDate().format(FMT));
                r.createCell(4).setCellValue(so.getScheduleDate() != null ? so.getScheduleDate().toString() : "");
                r.createCell(5).setCellValue(so.getLines().size());
            }
            autoSizeColumns(soSheet, soHeaders.length);

            // ── Sheet 3: Purchase Orders ──────────────────────────────────
            Sheet poSheet = wb.createSheet("Purchase Orders");
            String[] poHeaders = {"Ref", "Vendor", "Status", "Created", "Auto-Triggered", "Lines"};
            createHeaderRow(poSheet, poHeaders, headerStyle);
            row = 1;
            for (PurchaseOrder po : poRepository.findAll()) {
                Row r = poSheet.createRow(row++);
                r.createCell(0).setCellValue(po.getRef());
                r.createCell(1).setCellValue(po.getVendor().getName());
                r.createCell(2).setCellValue(po.getStatus().name());
                r.createCell(3).setCellValue(po.getCreationDate().format(FMT));
                r.createCell(4).setCellValue(po.getTriggeredBySoId() != null ? "Yes" : "No");
                r.createCell(5).setCellValue(po.getLines().size());
            }
            autoSizeColumns(poSheet, poHeaders.length);

            // ── Sheet 4: Manufacturing Orders ─────────────────────────────
            Sheet moSheet = wb.createSheet("Manufacturing Orders");
            String[] moHeaders = {"Ref", "Product", "Qty", "Status", "Assignee", "Auto-Triggered", "Created"};
            createHeaderRow(moSheet, moHeaders, headerStyle);
            row = 1;
            for (ManufacturingOrder mo : moRepository.findAll()) {
                Row r = moSheet.createRow(row++);
                r.createCell(0).setCellValue(mo.getRef());
                r.createCell(1).setCellValue(mo.getFinishedProduct().getName());
                r.createCell(2).setCellValue(mo.getQuantity());
                r.createCell(3).setCellValue(mo.getStatus().name());
                r.createCell(4).setCellValue(mo.getAssignee() != null ? mo.getAssignee().getName() : "Unassigned");
                r.createCell(5).setCellValue(mo.getTriggeredBySoId() != null ? "Yes" : "No");
                r.createCell(6).setCellValue(mo.getCreationDate().format(FMT));
            }
            autoSizeColumns(moSheet, moHeaders.length);

            // ── Sheet 5: Stock Ledger ─────────────────────────────────────
            Sheet ledgerSheet = wb.createSheet("Stock Ledger");
            String[] ledgerHeaders = {"Date", "Product", "Movement", "Qty", "Balance Before", "Balance After", "Source", "Ref"};
            createHeaderRow(ledgerSheet, ledgerHeaders, headerStyle);
            row = 1;
            for (StockLedger entry : stockLedgerRepository.findAllByOrderByDateTimeDesc()) {
                Row r = ledgerSheet.createRow(row++);
                r.createCell(0).setCellValue(entry.getDateTime().format(FMT));
                r.createCell(1).setCellValue(entry.getProduct().getName());
                r.createCell(2).setCellValue(entry.getMovementType());
                double qty = "STOCK_OUT".equals(entry.getMovementType()) ? -entry.getQuantity() : entry.getQuantity();
                r.createCell(3).setCellValue(qty);
                r.createCell(4).setCellValue(entry.getBalanceBefore());
                r.createCell(5).setCellValue(entry.getBalanceAfter());
                r.createCell(6).setCellValue(entry.getSourceType() != null ? entry.getSourceType() : "");
                r.createCell(7).setCellValue(entry.getSourceRef() != null ? entry.getSourceRef() : "");
            }
            autoSizeColumns(ledgerSheet, ledgerHeaders.length);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void createHeaderRow(Sheet sheet, String[] headers, CellStyle style) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void autoSizeColumns(Sheet sheet, int count) {
        for (int i = 0; i < count; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.min(width + 512, 10000));
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font headerFont = wb.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(headerFont);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("₹#,##0.00"));
        return style;
    }
}
