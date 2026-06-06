# <img width="56" height="61" alt="image" src="https://github.com/user-attachments/assets/02634a94-9267-491a-8523-04a981f56c8b" />
VendorBridge (Procurement Galaxy ERP)

**VendorBridge (Procurement Galaxy)** is a centralized, role-based ERP designed to streamline and digitize modern procurement operations. Built with a high-fidelity, space-themed cosmic interface and robust clean architecture, the platform enables organizations to register vendors, manage Request for Quotations (RFQs), evaluate quotations, execute multi-role approvals, issue Purchase Orders (POs), and track invoices seamlessly.

---

## 🚀 Key Features

* **Command Center Dashboard**: Real-time visualization of procurement metrics (Active RFQs, Pending Approvals, Spend, Overdue Invoices) alongside a 6-month interactive spending trend area chart.
* **Supplier Deck (Vendor Registry)**: Unified ledger for vendor onboarding with live GSTIN formatting checks, category filters, interactive active/inactive toggles, and supplier rating metrics.
* **RFQ & Quote Portal**: Structured workflow enabling procurement officers to broadcast RFQs and register, update, and compare multiple vendor quotations.
* **Approvals Deck**: Dedicated managerial workflow supporting real-time Approve/Reject decisions with custom resolution remarks.
* **Purchase Order Terminal**: Dynamic PO tracking, agreement completions, and a printable PO system that outputs neat PDF printouts.
* **Invoice Desk**: Automated billing, invoice status tracking (Draft, Sent, Paid), and integrated email dispatch tools.
* **Audit Trail (Activity Log)**: System-wide action logs tracking entities, actions, user stamps, and timestamps for robust compliance.

---

## 🛠️ Technology Stack

### Backend Console
* **Framework**: FastAPI (Python 3.10+)
* **Database**: SQLite (relational storage with SQLAlchemy ORM)
* **API Utilities**: Pydantic models for validation, CORS middleware configurations.

### Frontend Dashboard
* **Framework**: React 18+ powered by Vite
* **Styling**: Tailwind CSS & Vanilla CSS (Space gradients, custom scrollbars, and keyframe auroras)
* **Icons & Visualization**: Lucide React & Recharts
* **Client Uplink**: Axios with predefined API interceptors

---

## 🎨 Cosmic UI Design & Aesthetics

The interface is built to deliver a premium, high-tech experience:
* **Space Drift Auroras**: Smooth drifting background gradient bubbles (`@keyframes space-drift`) to keep the console layout alive.
* **Glassmorphic Panels**: Custom blur layers (`backdrop-filter`) with translucent violet borders.
* **Pulsing Beacons**: Interactive, breathing status indicators signaling system connectivity.
* **Micro-interactions**: Subtle translation nudges, 3D card scale expansions, and icon rotations on hovered action elements.
* **Sci-Fi Scrollbars**: Custom, ultra-thin scroll tracks that fit natively into dark mode layouts.

---

## 🔧 Getting Started

### Prerequisites
* **Python** (v3.10 or higher)
* **Node.js** (v18 or higher) and **npm**

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Unix/macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend Uvicorn development server:
   ```bash
   python run.py
   ```
   *The API will boot locally on [http://localhost:8000](http://localhost:8000)*

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will launch on [http://localhost:3000](http://localhost:3000)*

---

## 👥 Role-Based Access Controls

The platform implements security scopes based on user roles:
* **Admin**: Complete system dashboard access, activity logs, vendor management, RFQs, POs, and Invoices.
* **Officer**: General procurement operations (Creating RFQs, managing vendors, viewing spend logs).
* **Manager**: Approval deck access for reviewing quotes, signing off POs, and submitting remarks.
* **Vendor**: Dedicated vendor view for viewing active RFQs, submitting quote proposals, and tracking invoices.
