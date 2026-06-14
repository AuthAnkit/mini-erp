package com.minierp.config;

import com.minierp.entity.*;
import com.minierp.enums.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final PasswordEncoder passwordEncoder;
    private final SalesOrderRepository salesOrderRepo;
    private final PurchaseOrderRepository purchaseOrderRepo;
    private final ManufacturingOrderRepository moRepo;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepo.count() > 0) return; // Already seeded

        log.info("Initializing ErpMini — seeding default users...");

        // ── Default Users ──────────────────────────────────────────
        userRepo.save(User.builder()
                .loginId("admin")
                .name("Administrator")
                .email("admin@yourcompany.com")
                .password(passwordEncoder.encode("admin123"))
                .role(UserRole.ADMIN)
                .position("System Administrator")
                .build());

        userRepo.save(User.builder()
                .loginId("owner")
                .name("Business Owner")
                .email("owner@yourcompany.com")
                .password(passwordEncoder.encode("owner123"))
                .role(UserRole.OWNER)
                .position("Owner")
                .build());

        userRepo.save(User.builder()
                .loginId("sales")
                .name("Sales Manager")
                .email("sales@yourcompany.com")
                .password(passwordEncoder.encode("sales123"))
                .role(UserRole.SALES)
                .position("Sales Manager")
                .build());

        userRepo.save(User.builder()
                .loginId("purchase")
                .name("Purchase Manager")
                .email("purchase@yourcompany.com")
                .password(passwordEncoder.encode("purchase123"))
                .role(UserRole.PURCHASE)
                .position("Purchase Manager")
                .build());

        userRepo.save(User.builder()
                .loginId("manufacturing")
                .name("Production Head")
                .email("mfg@yourcompany.com")
                .password(passwordEncoder.encode("mfg123"))
                .role(UserRole.MANUFACTURING)
                .position("Production Head")
                .build());

        // ── Sample Vendor (generic) ────────────────────────────────
        Vendor sampleVendor = vendorRepo.save(Vendor.builder()
                .name("Sample Supplier Co.")
                .address("123 Supplier Street, City, State")
                .contactEmail("contact@samplesupplier.com")
                .contactPhone("+91-9000000000")
                .build());

        // ── Sample Customer (generic) ──────────────────────────────
        customerRepo.save(Customer.builder()
                .name("Sample Customer Ltd.")
                .address("456 Customer Avenue, City, State")
                .contactEmail("orders@samplecustomer.com")
                .contactPhone("+91-8000000000")
                .build());

        // ── Sample Products (generic, any industry) ────────────────
        // Raw material
        Product rawMaterial = productRepo.save(Product.builder()
                .ref("RM-00001")
                .name("Sample Raw Material")
                .category("Raw Material")
                .description("Replace with your actual raw material")
                .salesPrice(BigDecimal.valueOf(100))
                .costPrice(BigDecimal.valueOf(70))
                .onHandQty(500.0)
                .reservedQty(0.0)
                .procureOnDemand(true)
                .procurementMethod(ProcurementMethod.PURCHASE)
                .vendor(sampleVendor)
                .build());

        // Finished product
        Product finishedProduct = productRepo.save(Product.builder()
                .ref("FG-00001")
                .name("Sample Finished Product")
                .category("Finished Good")
                .description("Replace with your actual finished good")
                .salesPrice(BigDecimal.valueOf(500))
                .costPrice(BigDecimal.valueOf(300))
                .onHandQty(50.0)
                .reservedQty(0.0)
                .procureOnDemand(true)
                .procurementMethod(ProcurementMethod.MANUFACTURING)
                .build());

        // BoM: Finished Product = 2 x Raw Material
        finishedProduct.getBomComponents().add(BomComponent.builder()
                .parentProduct(finishedProduct)
                .componentProduct(rawMaterial)
                .quantity(2.0)
                .uom("Units")
                .build());
        finishedProduct.getBomOperations().add(BomOperation.builder()
                .product(finishedProduct)
                .operation("Assembly")
                .workCenter("Work Center 1")
                .expectedDurationMinutes(30)
                .build());
        productRepo.save(finishedProduct);

        // ── Realistic Furniture Industry Data ──────────────────────────────
        // Vendors
        String[] vendorNames = {"Timberland Woods & Co.", "Steel & Hardware Supplies Ltd.", "Global Fabrics & Textiles", "Paint & Varnish Co.", "Packaging Solutions Inc."};
        for (int i = 0; i < vendorNames.length; i++) {
            vendorRepo.save(Vendor.builder()
                    .name(vendorNames[i])
                    .address((i+1)*100 + " Industrial Park, Cityville")
                    .contactEmail("contact@" + vendorNames[i].replaceAll("[^a-zA-Z]", "").toLowerCase() + ".com")
                    .contactPhone("+91-9000000" + String.format("%03d", i))
                    .build());
        }

        // Customers
        String[] customerNames = {"Urban Home Furniture", "Cozy Living Spaces", "Modern Office Designs", "Luxury Interiors Ltd.", "The Furniture Emporium"};
        for (int i = 0; i < customerNames.length; i++) {
            customerRepo.save(Customer.builder()
                    .name(customerNames[i])
                    .address((i+1)*50 + " High Street, Retail District")
                    .contactEmail("orders@" + customerNames[i].replaceAll("[^a-zA-Z]", "").toLowerCase() + ".com")
                    .contactPhone("+91-8000000" + String.format("%03d", i))
                    .build());
        }

        // Products
        String[] productNames = {
                "Oak Dining Table", "Ergonomic Office Chair", "Leather Recliner Sofa", 
                "Pine Wood Wardrobe", "Glass Coffee Table", "King Size Bed Frame", 
                "Wooden Bookshelf", "TV Entertainment Unit", "Study Desk", "Outdoor Patio Set"
        };
        String[] categories = {
                "Tables", "Chairs", "Sofas", "Storage", "Tables", "Beds", "Storage", "Storage", "Desks", "Outdoor"
        };
        for (int i = 0; i < productNames.length; i++) {
            productRepo.save(Product.builder()
                    .ref("FUR-" + String.format("%04d", i+1))
                    .name(productNames[i])
                    .category(categories[i])
                    .description("High quality " + productNames[i].toLowerCase() + " for modern homes.")
                    .salesPrice(BigDecimal.valueOf(150 + i * 45))
                    .costPrice(BigDecimal.valueOf(80 + i * 20))
                    .onHandQty(50.0 + i * 5)
                    .reservedQty(0.0)
                    .procureOnDemand(false)
                    .procurementMethod(ProcurementMethod.PURCHASE)
                    .vendor(sampleVendor)
                    .build());
        }

        // ── Seed Orders (Sales, Purchase, Manufacturing) ──────────────────────────────
        User adminUser = userRepo.findByLoginId("admin").orElse(null);
        Customer firstCustomer = customerRepo.findAll().get(0);
        Vendor firstVendor = vendorRepo.findAll().get(0);
        Product firstFurniture = productRepo.findByRef("FUR-0001").orElse(null);

        // Sales Order
        if (firstCustomer != null && firstFurniture != null) {
            SalesOrder so = SalesOrder.builder()
                    .ref("SO-DEMO-1")
                    .customer(firstCustomer)
                    .customerAddress(firstCustomer.getAddress())
                    .salesPerson(adminUser)
                    .status(SalesOrderStatus.CONFIRMED)
                    .build();
            SalesOrderLine sol = SalesOrderLine.builder()
                    .salesOrder(so)
                    .product(firstFurniture)
                    .orderedQty(5.0)
                    .salesPrice(firstFurniture.getSalesPrice())
                    .build();
            so.getLines().add(sol);
            salesOrderRepo.save(so);
        }

        // Purchase Order
        if (firstVendor != null && firstFurniture != null) {
            PurchaseOrder po = PurchaseOrder.builder()
                    .ref("PO-DEMO-1")
                    .vendor(firstVendor)
                    .vendorAddress(firstVendor.getAddress())
                    .responsiblePerson(adminUser)
                    .status(PurchaseOrderStatus.CONFIRMED)
                    .build();
            PurchaseOrderLine pol = PurchaseOrderLine.builder()
                    .purchaseOrder(po)
                    .product(firstFurniture)
                    .orderedQty(20.0)
                    .costPrice(firstFurniture.getCostPrice())
                    .build();
            po.getLines().add(pol);
            purchaseOrderRepo.save(po);
        }

        // Manufacturing Order (triggering shortage!)
        // Create an MO for Finished Product that requires 20 Raw Materials, but Raw Material has only 5 left.
        rawMaterial.setOnHandQty(5.0); // Make it 5
        productRepo.save(rawMaterial);

        ManufacturingOrder mo = ManufacturingOrder.builder()
                .ref("MO-DEMO-SHORTAGE")
                .finishedProduct(finishedProduct)
                .quantity(10.0) // Requires 10 * 2 = 20 Raw Materials
                .assignee(adminUser)
                .status(ManufacturingOrderStatus.CONFIRMED)
                .build();
        MOComponent moc = MOComponent.builder()
                .manufacturingOrder(mo)
                .product(rawMaterial)
                .toConsumeQty(20.0)
                .consumedQty(0.0)
                .build();
        mo.getComponents().add(moc);
        moRepo.save(mo);

        log.info("✅ ErpMini initialized successfully!");
        log.info("Default login credentials:");
        log.info("  admin       / admin123    (Full access — System Admin)");
        log.info("  owner       / owner123    (Owner)");
        log.info("  sales       / sales123    (Sales Manager)");
        log.info("  purchase    / purchase123 (Purchase Manager)");
        log.info("  manufacturing / mfg123    (Production Head)");
        log.info("Login at http://localhost:5173 and configure your products, vendors and customers.");
    }
}
