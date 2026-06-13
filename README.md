# ErpMini

A lightweight, production-ready **Enterprise Resource Planning (ERP)** platform built for small and mid-sized businesses. Covers the full operational lifecycle — from sales orders and procurement to manufacturing and inventory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 · Spring Boot 3 · Spring Security (JWT) · JPA / Hibernate |
| Database | H2 (dev) — easily swappable to PostgreSQL |
| Frontend | React 18 · Vite · TailwindCSS |
| Real-time | WebSocket (STOMP over SockJS) |
| Export | Apache POI (Excel) |

---

## Modules

- **Dashboard** — live KPIs, stock alerts, bottleneck detection
- **Sales Orders** — customer order lifecycle with auto-reservation
- **Purchase Orders** — vendor PO management with receipt flow
- **Manufacturing** — production orders, Bill of Materials (BoM), work-center operations
- **Products & BoM** — multi-level bill of materials, procurement methods
- **Vendors** — supplier directory
- **Audit Logs** — full change history for every entity

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.9+ (or use your system Maven)

### 1. Backend

```bash
cd backend
mvn spring-boot:run
# API available at http://localhost:8080
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Default Credentials

| Login ID | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator — full access |
| `owner` | `owner123` | Owner |
| `sales` | `sales123` | Sales Manager |
| `purchase` | `purchase123` | Purchase Manager |
| `manufacturing` | `mfg123` | Production Head |

> Credentials are seeded on first boot. Reset by restarting the backend (H2 is in-memory by default).

---

## Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "loginId": "jane.doe",
  "password": "securepass",
  "name": "Jane Doe",
  "email": "jane@company.com",
  "role": "SALES"
}
```

Valid roles: `ADMIN`, `OWNER`, `SALES`, `PURCHASE`, `MANUFACTURING`, `INVENTORY`

---

## License

MIT
