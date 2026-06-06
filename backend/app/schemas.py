from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ==================== AUTH SCHEMAS ====================
class UserBase(BaseModel):
    username: str
    email: str
    role: str # ADMIN, OFFICER, VENDOR, MANAGER

class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    additional_info: Optional[str] = None

class UserResponse(UserBase):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    additional_info: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    email: str

class TokenData(BaseModel):
    username: Optional[str] = None


# ==================== VENDOR SCHEMAS ====================
class VendorBase(BaseModel):
    name: str
    category: str
    gst_number: str
    contact_email: str
    contact_phone: str
    address: str
    status: Optional[str] = "ACTIVE"
    rating: Optional[float] = 5.0

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== RFQ SCHEMAS ====================
class RFQItemBase(BaseModel):
    product_name: str
    quantity: float
    unit: str
    specifications: Optional[str] = None

class RFQItemCreate(RFQItemBase):
    pass

class RFQItemResponse(RFQItemBase):
    id: int
    rfq_id: int

    class Config:
        from_attributes = True

class RFQBase(BaseModel):
    title: str
    description: str
    deadline: datetime
    status: Optional[str] = "DRAFT"

class RFQCreate(RFQBase):
    items: List[RFQItemCreate]
    vendor_ids: List[int] # List of Vendor IDs to invite

class RFQResponse(RFQBase):
    id: int
    created_by_id: int
    created_at: datetime
    items: List[RFQItemResponse] = []

    class Config:
        from_attributes = True


# ==================== QUOTATION SCHEMAS ====================
class QuotationItemBase(BaseModel):
    rfq_item_id: int
    unit_price: float
    total_price: float

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItemResponse(QuotationItemBase):
    id: int

    class Config:
        from_attributes = True

class QuotationBase(BaseModel):
    rfq_id: int
    vendor_id: int
    total_amount: float
    delivery_days: int
    notes: Optional[str] = None
    status: Optional[str] = "SUBMITTED"

class QuotationCreate(BaseModel):
    rfq_id: int
    vendor_id: int
    total_amount: float
    delivery_days: int
    notes: Optional[str] = None
    items: List[QuotationItemCreate]

class QuotationResponse(QuotationBase):
    id: int
    submitted_at: datetime
    items: List[QuotationItemResponse] = []

    class Config:
        from_attributes = True


# ==================== APPROVAL SCHEMAS ====================
class ApprovalBase(BaseModel):
    rfq_id: int
    quotation_id: int

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalResolve(BaseModel):
    status: str # APPROVED, REJECTED
    remarks: Optional[str] = None

class ApprovalResponse(ApprovalBase):
    id: int
    requested_by_id: int
    approved_by_id: Optional[int] = None
    status: str
    remarks: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== PURCHASE ORDER SCHEMAS ====================
class PurchaseOrderBase(BaseModel):
    po_number: str
    rfq_id: int
    quotation_id: int
    vendor_id: int
    status: str
    total_amount: float

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    issued_at: datetime

    class Config:
        from_attributes = True


# ==================== INVOICE SCHEMAS ====================
class InvoiceBase(BaseModel):
    invoice_number: str
    po_id: int
    vendor_id: int
    subtotal: float
    tax_percent: float
    tax_amount: float
    total: float
    status: str

class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== ACTIVITY LOG SCHEMAS ====================
class ActivityLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    metadata_json: Optional[str] = None

class ActivityLogResponse(ActivityLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
