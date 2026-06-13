package com.minierp.controller;

import com.minierp.entity.*;
import com.minierp.enums.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * Kanban view endpoint — groups orders by status columns.
 * Fulfills the "Dashboard + Kanban views" requirement from the module build order.
 */
@RestController
@RequestMapping("/api/kanban")
@RequiredArgsConstructor
public class KanbanController {

    private final SalesOrderRepository soRepository;
    private final PurchaseOrderRepository poRepository;
    private final ManufacturingOrderRepository moRepository;

    /**
     * GET /api/kanban/sales
     * Returns SO grouped by status: DRAFT | CONFIRMED | PARTIALLY_DELIVERED | FULLY_DELIVERED
     */
    @GetMapping("/sales")
    public ResponseEntity<?> salesKanban() {
        Map<String, Object> board = new LinkedHashMap<>();
        for (SalesOrderStatus status : SalesOrderStatus.values()) {
            List<SalesOrder> orders = soRepository.findByStatus(status);
            board.put(status.name(), orders.stream().map(so -> Map.of(
                "id", so.getId(),
                "ref", so.getRef(),
                "customer", so.getCustomer().getName(),
                "linesCount", so.getLines().size(),
                "scheduleDate", so.getScheduleDate() != null ? so.getScheduleDate().toString() : "",
                "creationDate", so.getCreationDate().toString()
            )).toList());
        }
        return ResponseEntity.ok(board);
    }

    /**
     * GET /api/kanban/purchase
     * Returns PO grouped by status: DRAFT | CONFIRMED | PARTIALLY_RECEIVED | FULLY_RECEIVED
     */
    @GetMapping("/purchase")
    public ResponseEntity<?> purchaseKanban() {
        Map<String, Object> board = new LinkedHashMap<>();
        for (PurchaseOrderStatus status : PurchaseOrderStatus.values()) {
            List<PurchaseOrder> orders = poRepository.findByStatus(status);
            board.put(status.name(), orders.stream().map(po -> Map.of(
                "id", po.getId(),
                "ref", po.getRef(),
                "vendor", po.getVendor().getName(),
                "linesCount", po.getLines().size(),
                "autoTriggered", po.getTriggeredBySoId() != null,
                "scheduleDate", po.getScheduleDate() != null ? po.getScheduleDate().toString() : ""
            )).toList());
        }
        return ResponseEntity.ok(board);
    }

    /**
     * GET /api/kanban/manufacturing
     * Returns MO grouped by status: DRAFT | CONFIRMED | IN_PROGRESS | DONE
     * This is the primary Kanban view — operators see which MOs to work on.
     */
    @GetMapping("/manufacturing")
    public ResponseEntity<?> manufacturingKanban() {
        Map<String, Object> board = new LinkedHashMap<>();
        for (ManufacturingOrderStatus status : ManufacturingOrderStatus.values()) {
            List<ManufacturingOrder> orders = moRepository.findByStatus(status);
            board.put(status.name(), orders.stream().map(mo -> {
                long doneWOs = mo.getWorkOrders().stream()
                    .filter(wo -> wo.getStatus() == WorkOrderStatus.DONE).count();
                long totalWOs = mo.getWorkOrders().size();
                return Map.of(
                    "id", mo.getId(),
                    "ref", mo.getRef(),
                    "product", mo.getFinishedProduct().getName(),
                    "qty", mo.getQuantity(),
                    "assignee", mo.getAssignee() != null ? mo.getAssignee().getName() : "Unassigned",
                    "workOrderProgress", totalWOs > 0 ? (doneWOs * 100 / totalWOs) + "%" : "N/A",
                    "autoTriggered", mo.getTriggeredBySoId() != null,
                    "scheduleDate", mo.getScheduleDate() != null ? mo.getScheduleDate().toString() : ""
                );
            }).toList());
        }
        return ResponseEntity.ok(board);
    }

    /**
     * GET /api/kanban/all
     * Single endpoint returning all three boards at once — for the dashboard widget.
     */
    @GetMapping("/all")
    public ResponseEntity<?> allKanban() {
        Map<String, Object> all = new HashMap<>();
        all.put("salesBoard", salesKanban().getBody());
        all.put("purchaseBoard", purchaseKanban().getBody());
        all.put("manufacturingBoard", manufacturingKanban().getBody());
        return ResponseEntity.ok(all);
    }
}
