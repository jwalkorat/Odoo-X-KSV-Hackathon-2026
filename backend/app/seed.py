from sqlalchemy.orm import Session
import datetime
from database import SessionLocal, engine, Base
from models import User, Vendor, RFQ, RFQItem, RFQVendor
from auth import get_password_hash

def seed_db():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(User).first() is not None:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")
        
        # 1. Create Users
        users_data = [
            {"username": "admin", "email": "admin@galaxy.com", "role": "ADMIN", "password": "admin123"},
            {"username": "officer", "email": "officer@galaxy.com", "role": "OFFICER", "password": "officer123"},
            {"username": "manager", "email": "manager@galaxy.com", "role": "MANAGER", "password": "manager123"},
            {"username": "vendor1", "email": "vendor1@gmail.com", "role": "VENDOR", "password": "vendor123"},
            {"username": "vendor2", "email": "vendor2@gmail.com", "role": "VENDOR", "password": "vendor123"},
        ]
        
        seeded_users = []
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                role=u["role"],
                hashed_password=get_password_hash(u["password"])
            )
            db.add(user)
            seeded_users.append(user)
        
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
            seeded_vendors.append(vendor)
            
        db.commit()
        print(f"Seeded {len(seeded_vendors)} vendors.")

        # 3. Create a default Open RFQ
        rfq = RFQ(
            title="Galactic Server Infrastructure Upgrade",
            description="Procurement of high-performance quantum servers and fiber optics for the Gandhinagar ground control base.",
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            status="OPEN",
            created_by_id=2 # ID of 'officer'
        )
        db.add(rfq)
        db.commit()
        db.refresh(rfq)

        # 4. Add items to RFQ
        items = [
            RFQItem(rfq_id=rfq.id, product_name="Quantum Compute Core Node v3", quantity=5.0, unit="pcs", specifications="256 qubits, liquid helium cooled"),
            RFQItem(rfq_id=rfq.id, product_name="Tachyon Fiber Optic Cable 10km", quantity=1.0, unit="pcs", specifications="100 Gbps zero-latency throughput")
        ]
        for item in items:
            db.add(item)
            
        # 5. Invite Vendors
        invites = [
            RFQVendor(rfq_id=rfq.id, vendor_id=1, status="PENDING"),
            RFQVendor(rfq_id=rfq.id, vendor_id=2, status="PENDING")
        ]
        for invite in invites:
            db.add(invite)

        db.commit()
        print("Seeded sample RFQ, line items, and vendor invites.")
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
