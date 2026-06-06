# <img width="56" height="56" alt="image" src="https://github.com/user-attachments/assets/02634a94-9267-491a-8523-04a981f56c8b" /> VendorBridge

**VendorBridge** is a web-based ERP designed to manage and track the full B2B procurement lifecycle. The platform enables organizations to register vendors, handle Request for Quotations (RFQs), evaluate quotations, execute manager approvals, issue Purchase Orders (POs), track invoices, and log all operational activities.

---

## Key Features

| Module | Capabilities |
| --- | --- |
| **Authentication** | Secure signup, login, JWT session state, and password resets via Gmail SMTP OTP. |
| **Vendors** | Supplier onboarding, GSTIN verification, active/inactive status toggle, and rating metrics. |
| **RFQs** | Create detailed RFQs, specify item quantities/units/specifications, and assign active vendors. |
| **Quotations** | Vendors submit bids; officers compare and select quotes for manager review. |
| **Approvals** | Managers review requisition requests with custom remarks. Approving automatically generates a Purchase Order. |
| **Purchase Orders** | Automatic tracking of PO numbers and delivery statuses (DRAFT, ISSUED, COMPLETED). |
| **Invoices** | Generate invoices from POs, track billing state, and email professional HTML copies directly to suppliers. |
| **Activity Logs** | System-wide compliance audits logging actions, timestamps, and usernames. |
| **Reports** | Spend analytics, monthly trends, and supplier performance rankings visualized via interactive charts. |

---

## Tech Stack

| Component | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, React Router, Axios, Recharts, Tailwind CSS |
| **Backend** | FastAPI (Python 3.10+), SQLAlchemy ORM, Uvicorn |
| **Database** | SQLite (default `procurement_galaxy.db`), support for PostgreSQL |
| **Authentication** | JWT, passlib (bcrypt), python-jose |
| **Email Service** | SMTP (smtplib, Gmail App Passwords) |

---

## Project Structure

```text
.
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── routers/          # API route definitions (auth, vendors, rfqs, approvals, orders, logs)
│   │   ├── auth.py           # JWT generation and hashing helpers
│   │   ├── config.py         # App configuration settings and env loader
│   │   ├── database.py       # SQLAlchemy engine and DB session setup
│   │   ├── email_service.py  # SMTP email handlers for OTP & invoices
│   │   ├── models.py         # SQLAlchemy database schemas
│   │   ├── schemas.py        # Pydantic schemas for request validation
│   │   ├── seed_large.py     # Large dataset seeder (users, vendors, rfqs, orders)
│   │   └── main.py           # Application entrypoint
│   ├── run.py                # Server startup script
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React Application (Vite)
    ├── src/
    │   ├── context/          # Auth context and session management
    │   ├── layouts/          # Layout wrappers
    │   ├── lib/              # Axios client and utility functions
    │   ├── pages/            # Page components (Dashboard, RFQs, Approvals, Invoices, Logs, etc.)
    │   ├── App.jsx           # Routing configuration
    │   └── main.jsx          # Vite initialization
    ├── package.json          # Node dependencies and scripts
    └── vite.config.js        # Vite port configurations
```

---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher and npm

---

## Quick Start

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the data seeder to populate the database:
   ```bash
   python -m app.seed_large
   ```
5. Start the backend development server:
   ```bash
   python run.py
   ```
   The backend API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application opens at [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

Seeded accounts for testing (Password format: `<role>123` e.g., `admin123`):

| Role | Username | Email | Key Action |
| --- | --- | --- | --- |
| **Admin** | `admin` | `admin@galaxy.com` | Access system configurations and view activity logs. |
| **Procurement Officer** | `officer` | `officer@galaxy.com` | Create RFQs, view quotations, and generate invoices. |
| **Manager** | `manager` | `manager@galaxy.com` | Approve or reject quote requisitions. |
| **Vendor 1** | `vendor1` | `vendor1@gmail.com` | Access the vendor portal for Nebula IT Solutions. |
| **Vendor 2** | `vendor2` | `vendor2@gmail.com` | Access the vendor portal for Supernova Raw Materials. |

---

## Procurement Workflow

1. **RFQ Creation**: A procurement officer creates an RFQ and assigns multiple active vendors.
2. **Quote Submission**: Vendors log in to view active RFQs and submit quotation pricing and delivery terms.
3. **Manager Approval**: The officer compares submitted quotations and requests approval for the selected quote.
4. **PO Issuance**: The manager reviews the request. Upon approval, a Purchase Order is automatically generated and the RFQ is closed.
5. **Billing**: The officer generates an Invoice from the approved PO.
6. **Email Dispatch**: The officer clicks "Email Invoice" to send a structured HTML copy to the vendor's email via Gmail SMTP.

---

## Email Configuration

To enable password reset OTPs and HTML invoice dispatch:
1. Create a Google App Password for your Gmail account.
2. Create or edit the `backend/.env` file with these keys:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   SMTP_FROM=your-email@gmail.com
   SMTP_FROM_NAME="VendorBridge Support"
   ```
3. Restart the backend server. If no SMTP is configured, OTPs are printed directly in the backend terminal console.

---

## API Overview

The API prefix is `/api`. Protected routes require a Bearer token in the `Authorization` header.

| Endpoint Group | Prefix | Key Routes |
| --- | --- | --- |
| **Authentication** | `/api/auth` | `/register`, `/login`, `/me`, `/forgot-password` |
| **Vendors** | `/api/vendors` | `GET /`, `GET /{id}`, `POST /`, `PATCH /{id}/status` |
| **RFQs & Quotes** | `/api/rfqs` | `GET /`, `GET /{id}`, `POST /`, `POST /{id}/quotes`, `PATCH /{id}/quotes/{quote_id}` |
| **Approvals** | `/api/approvals` | `GET /`, `POST /` (request), `POST /{id}/resolve` (approve/reject) |
| **Orders & Invoices** | `/api/orders` | `GET /purchase-orders`, `GET /invoices`, `POST /invoices`, `POST /invoices/{id}/email` |
| **Activity Logs** | `/api/logs` | `GET /` (compliance audit trail logs) |

---

## Troubleshooting

- **Invalid Auth Credentials**: Clear `galaxy_token` and `galaxy_user` from your browser's Local Storage, then sign in.
- **Port Conflicts**: Ensure port `3000` (frontend) and `8000` (backend) are free before running the dev servers.
- **SQLite Database Locks**: If database updates fail, ensure no database clients are locking the SQLite database file (`procurement_galaxy.db`).
