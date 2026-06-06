import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="VENDOR") # ADMIN, OFFICER, VENDOR, MANAGER
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    country = Column(String, nullable=True)
    additional_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rfqs = relationship("RFQ", back_populates="creator")
    requested_approvals = relationship("Approval", foreign_keys="[Approval.requested_by_id]", back_populates="requester")
    resolved_approvals = relationship("Approval", foreign_keys="[Approval.approved_by_id]", back_populates="resolver")
    logs = relationship("ActivityLog", back_populates="user")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False) # IT, Raw Materials, Logistics, Services, Other
    gst_number = Column(String, unique=True, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, BLACKLISTED
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rfq_links = relationship("RFQVendor", back_populates="vendor")
    quotations = relationship("Quotation", back_populates="vendor")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")
    invoices = relationship("Invoice", back_populates="vendor")

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(String, default="DRAFT") # DRAFT, OPEN, CLOSED, CANCELLED
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="rfqs")
    items = relationship("RFQItem", back_populates="rfq", cascade="all, delete-orphan")
    vendor_links = relationship("RFQVendor", back_populates="rfq", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="rfq", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="rfq", cascade="all, delete-orphan")

class RFQItem(Base):
    __tablename__ = "rfq_items"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    product_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False) # pcs, kg, litre, hours, etc.
    specifications = Column(Text, nullable=True)

    # Relationships
    rfq = relationship("RFQ", back_populates="items")
    quote_items = relationship("QuotationItem", back_populates="rfq_item", cascade="all, delete-orphan")

class RFQVendor(Base):
    __tablename__ = "rfq_vendors"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    status = Column(String, default="PENDING") # PENDING, RESPONDED

    # Relationships
    rfq = relationship("RFQ", back_populates="vendor_links")
    vendor = relationship("Vendor", back_populates="rfq_links")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    total_amount = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, default="SUBMITTED") # SUBMITTED, SHORTLISTED, REJECTED
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rfq = relationship("RFQ", back_populates="quotations")
    vendor = relationship("Vendor", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="quotation", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="quotation")

class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    rfq_item_id = Column(Integer, ForeignKey("rfq_items.id"))
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    # Relationships
    quotation = relationship("Quotation", back_populates="items")
    rfq_item = relationship("RFQItem", back_populates="quote_items")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    requested_by_id = Column(Integer, ForeignKey("users.id"))
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    rfq = relationship("RFQ", back_populates="approvals")
    quotation = relationship("Quotation", back_populates="approvals")
    requester = relationship("User", foreign_keys=[requested_by_id], back_populates="requested_approvals")
    resolver = relationship("User", foreign_keys=[approved_by_id], back_populates="resolved_approvals")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    rfq_id = Column(Integer, ForeignKey("rfqs.id"))
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    status = Column(String, default="DRAFT") # DRAFT, ISSUED, COMPLETED
    total_amount = Column(Float, nullable=False)
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    rfq = relationship("RFQ", back_populates="purchase_orders")
    quotation = relationship("Quotation", back_populates="purchase_orders")
    vendor = relationship("Vendor", back_populates="purchase_orders")
    invoices = relationship("Invoice", back_populates="purchase_order", cascade="all, delete-orphan")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    subtotal = Column(Float, nullable=False)
    tax_percent = Column(Float, default=18.0) # Default 18% GST
    tax_amount = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, default="DRAFT") # DRAFT, SENT, PAID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
    vendor = relationship("Vendor", back_populates="invoices")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False) # e.g., "Created RFQ", "Approved Quotation"
    entity_type = Column(String, nullable=False) # e.g., "RFQ", "Quotation", "Approval"
    entity_id = Column(Integer, nullable=True)
    metadata_json = Column(String, nullable=True) # JSON stored as string for simplicity on SQLite/PostgreSQL compatibility
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="logs")
