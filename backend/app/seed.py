from sqlalchemy.orm import Session
import datetime
from .database import SessionLocal, engine, Base
from .models import User, Vendor, RFQ, RFQItem, RFQVendor, Quotation, QuotationItem, Approval, PurchaseOrder, Invoice, ActivityLog
from .auth import get_password_hash

def seed_db():
    # Make sure tables exist and are fresh
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    
    db = SessionLocal()
    
    try:
        print("Clearing existing database tables...")
        db.query(ActivityLog).delete()
        db.query(Invoice).delete()
        db.query(PurchaseOrder).delete()
        db.query(Approval).delete()
        db.query(QuotationItem).delete()
        db.query(Quotation).delete()
        db.query(RFQVendor).delete()
        db.query(RFQItem).delete()
        db.query(RFQ).delete()
        db.query(Vendor).delete()
        db.query(User).delete()
        db.commit()
        
        print("Seeding database...")
        
        # 1. Create Users
        users_data = [
            {"username": "admin", "email": "admin@galaxy.com", "role": "ADMIN", "password": "admin123", "first_name": "Jwal", "last_name": "Korat", "phone_number": "+91 9999999999", "country": "India"},
            {"username": "officer", "email": "officer@galaxy.com", "role": "OFFICER", "password": "officer123", "first_name": "Deepam", "last_name": "Raval", "phone_number": "+91 9888888888", "country": "India"},
            {"username": "manager", "email": "manager@galaxy.com", "role": "MANAGER", "password": "manager123", "first_name": "Meet", "last_name": "Madhwani", "phone_number": "+91 9777777777", "country": "India"},
            {"username": "vendor1", "email": "vendor1@gmail.com", "role": "VENDOR", "password": "vendor123", "first_name": "Kashvi", "last_name": "Porwal", "phone_number": "+91 9666666666", "country": "India"},
            {"username": "vendor2", "email": "vendor2@gmail.com", "role": "VENDOR", "password": "vendor123", "first_name": "Daksh", "last_name": "Patel", "phone_number": "+91 9555555555", "country": "India"},

        ]
        
        seeded_users = {}
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                role=u["role"],
                first_name=u["first_name"],
                last_name=u["last_name"],
                phone_number=u["phone_number"],
                country=u["country"],
                hashed_password=get_password_hash(u["password"])
            )
            db.add(user)
            db.flush()
            seeded_users[u["username"]] = user
        
        db.commit()
        print(f"Seeded {len(seeded_users)} users.")

        # 2. Create Vendors
        vendors_data = [
            {
                "name": "Nebula IT Solutions",
                "category": "IT",
                "gst_number": "24ABCDE1234F1Z1",
                "contact_email": "vendor1@gmail.com",
                "contact_phone": "9876543210",
                "address": "Asteroid Belt Office 404, Sector 7",
                "status": "ACTIVE",
                "rating": 4.8
            },
            {
                "name": "Supernova Raw Materials Corp",
                "category": "Raw Materials",
                "gst_number": "24XYZAB5678C1Z2",
                "contact_email": "vendor2@gmail.com",
                "contact_phone": "9876543211",
                "address": "Quantum Foundry Complex, Sector 9",
                "status": "ACTIVE",
                "rating": 4.5
            },
            {
                "name": "Hyperdrive Logistics",
                "category": "Logistics",
                "gst_number": "24QWERTY9012D1Z3",
                "contact_email": "logistics@hyperdrive.com",
                "contact_phone": "9876543212",
                "address": "Docking Bay 12, Gandhinagar Port",
                "status": "ACTIVE",
                "rating": 4.2
            }
        ]
        
        seeded_vendors = []
        for v in vendors_data:
            vendor = Vendor(**v)
            db.add(vendor)
            db.flush()
            seeded_vendors.append(vendor)
            
        db.commit()
        print(f"Seeded {len(seeded_vendors)} vendors.")

        # 3. Create Open RFQ 1
        rfq1 = RFQ(
            title="Galactic Server Infrastructure Upgrade",
            description="Procurement of high-performance quantum servers and fiber optics for the Gandhinagar ground control base.",
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            status="OPEN",
            created_by_id=seeded_users["officer"].id
        )
        db.add(rfq1)
        db.flush()

        # Add items to RFQ 1
        item1_1 = RFQItem(rfq_id=rfq1.id, product_name="Quantum Compute Core Node v3", quantity=5.0, unit="pcs", specifications="256 qubits, liquid helium cooled")
        item1_2 = RFQItem(rfq_id=rfq1.id, product_name="Tachyon Fiber Optic Cable 10km", quantity=1.0, unit="pcs", specifications="100 Gbps zero-latency throughput")
        db.add(item1_1)
        db.add(item1_2)
        db.flush()
            
        # Invite Vendors to RFQ 1
        db.add(RFQVendor(rfq_id=rfq1.id, vendor_id=seeded_vendors[0].id, status="PENDING"))
        db.add(RFQVendor(rfq_id=rfq1.id, vendor_id=seeded_vendors[1].id, status="PENDING"))
        db.flush()

        # 4. Seed Quotation for RFQ 1 (vendor 1)
        q1 = Quotation(
            rfq_id=rfq1.id,
            vendor_id=seeded_vendors[0].id,
            total_amount=1200000.0,
            delivery_days=5,
            notes="Using high-grade components. Standard warranty included.",
            status="SUBMITTED"
        )
        db.add(q1)
        db.flush()
        db.add(QuotationItem(quotation_id=q1.id, rfq_item_id=item1_1.id, unit_price=200000.0, total_price=1000000.0))
        db.add(QuotationItem(quotation_id=q1.id, rfq_item_id=item1_2.id, unit_price=200000.0, total_price=200000.0))
        db.flush()

        # 5. Seed Quotation for RFQ 1 (vendor 2)
        q2 = Quotation(
            rfq_id=rfq1.id,
            vendor_id=seeded_vendors[1].id,
            total_amount=1150000.0,
            delivery_days=8,
            notes="Slightly longer lead time but lower pricing on cabling.",
            status="SUBMITTED"
        )
        db.add(q2)
        db.flush()
        db.add(QuotationItem(quotation_id=q2.id, rfq_item_id=item1_1.id, unit_price=190000.0, total_price=950000.0))
        db.add(QuotationItem(quotation_id=q2.id, rfq_item_id=item1_2.id, unit_price=200000.0, total_price=200000.0))
        db.flush()

        # 6. Seed a pending Approval request for Quotation 2
        app1 = Approval(
            rfq_id=rfq1.id,
            quotation_id=q2.id,
            requested_by_id=seeded_users["officer"].id,
            status="PENDING",
            remarks="Evaluating Supernova Corp since total package cost is lower by 50,000 INR."
        )
        db.add(app1)
        db.flush()

        # 7. Create RFQ 2 (Already completed workflow)
        rfq2 = RFQ(
            title="Office Workspace Cosmic Furniture",
            description="Procurement of ergonomically optimized chairs for backend developers in Gandhinagar headquarters.",
            deadline=datetime.datetime.utcnow() - datetime.timedelta(days=1),
            status="CLOSED",
            created_by_id=seeded_users["officer"].id
        )
        db.add(rfq2)
        db.flush()

        item2_1 = RFQItem(rfq_id=rfq2.id, product_name="Anti-Gravity Swivel Chairs", quantity=10.0, unit="pcs", specifications="Memory foam lumbar support, mesh backing")
        db.add(item2_1)
        db.flush()

        db.add(RFQVendor(rfq_id=rfq2.id, vendor_id=seeded_vendors[0].id, status="RESPONDED"))
        db.flush()

        q3 = Quotation(
            rfq_id=rfq2.id,
            vendor_id=seeded_vendors[0].id,
            total_amount=150000.0,
            delivery_days=3,
            notes="Ready to ship immediately from state warehouse.",
            status="SHORTLISTED"
        )
        db.add(q3)
        db.flush()
        db.add(QuotationItem(quotation_id=q3.id, rfq_item_id=item2_1.id, unit_price=15000.0, total_price=150000.0))
        db.flush()

        # Approved Approval for Quotation 3
        app2 = Approval(
            rfq_id=rfq2.id,
            quotation_id=q3.id,
            requested_by_id=seeded_users["officer"].id,
            approved_by_id=seeded_users["manager"].id,
            status="APPROVED",
            remarks="Approved. Ergonomic upgrade is vital for developer comfort.",
            resolved_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        )
        db.add(app2)
        db.flush()

        # 8. Purchase Order issued from Approved Quotation 3
        po = PurchaseOrder(
            po_number="PO-2026-0001",
            rfq_id=rfq2.id,
            quotation_id=q3.id,
            vendor_id=seeded_vendors[0].id,
            status="ISSUED",
            total_amount=150000.0,
            issued_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        )
        db.add(po)
        db.flush()

        # 9. Draft Invoice from Purchase Order
        tax_pct = 18.0
        subtot = 150000.0
        tax_amt = subtot * (tax_pct / 100.0)
        tot = subtot + tax_amt
        
        inv = Invoice(
            invoice_number="INV-2026-0001",
            po_id=po.id,
            vendor_id=seeded_vendors[0].id,
            subtotal=subtot,
            tax_percent=tax_pct,
            tax_amount=tax_amt,
            total=tot,
            status="DRAFT"
        )
        db.add(inv)
        db.flush()

        # 10. Activity Logs for actions
        db.add(ActivityLog(user_id=seeded_users["officer"].id, action="Created RFQ", entity_type="RFQ", entity_id=rfq1.id))
        db.add(ActivityLog(user_id=seeded_users["officer"].id, action="Created RFQ", entity_type="RFQ", entity_id=rfq2.id))
        db.add(ActivityLog(user_id=seeded_users["officer"].id, action="Submitted Approval Request", entity_type="Approval", entity_id=app1.id))
        db.add(ActivityLog(user_id=seeded_users["manager"].id, action="Approved Quotation Package", entity_type="Approval", entity_id=app2.id))
        db.add(ActivityLog(user_id=seeded_users["manager"].id, action="Issued Purchase Order", entity_type="PurchaseOrder", entity_id=po.id))
        
        db.commit()
        print("Database seeding completed successfully with RFQs, Quotes, Approvals, POs, and Invoices!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
