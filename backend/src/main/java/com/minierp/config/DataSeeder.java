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
