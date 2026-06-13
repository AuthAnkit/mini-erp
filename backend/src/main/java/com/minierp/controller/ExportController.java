package com.minierp.controller;

import com.minierp.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Export controller — downloads Excel reports using Apache POI.
 * Fulfills the "Apache POI/iText for export" requirement.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * GET /api/export/inventory
     * Downloads full inventory report as .xlsx
     * Includes: Products, Sales Orders, Purchase Orders, Manufacturing Orders, Stock Ledger
     */
    @GetMapping("/inventory")
    public ResponseEntity<byte[]> exportInventory() {
        try {
            byte[] data = exportService.exportInventoryReport();
            String filename = "ShivFurniture_ERP_Report_" +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(data.length)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
