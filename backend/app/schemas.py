import re
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    name: str = Field(..., min_length=2, max_length=120)
    category: str = Field(..., min_length=2, max_length=60)
    gst_number: str = Field(..., min_length=15, max_length=15)
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=10, max_length=15)
    address: str = Field(..., min_length=8, max_length=500)
    status: Optional[str] = "ACTIVE"
    rating: Optional[float] = Field(default=5.0, ge=0, le=5)

    @field_validator("gst_number")
    @classmethod
    def validate_gst_number(cls, value: str) -> str:
        normalized = value.strip().upper()
        pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$"
        if not re.match(pattern, normalized):
            raise ValueError("GST number must be a valid 15-character GSTIN")
        return normalized

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = re.sub(r"[\s-]", "", value.strip())
        if not re.match(r"^\+?[0-9]{10,15}$", normalized):
            raise ValueError("Phone number must contain 10 to 15 digits")
        return normalized

    @field_validator("status")
    @classmethod
    def validate_vendor_status(cls, value: Optional[str]) -> str:
        normalized = (value or "ACTIVE").upper()
        if normalized not in {"ACTIVE", "INACTIVE", "BLACKLISTED"}:
            raise ValueError("Vendor status must be ACTIVE, INACTIVE, or BLACKLISTED")
        return normalized

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class VendorStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"ACTIVE", "INACTIVE", "BLACKLISTED"}:
            raise ValueError("Vendor status must be ACTIVE, INACTIVE, or BLACKLISTED")
        return normalized


# ==================== RFQ SCHEMAS ====================
class RFQItemBase(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=140)
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=30)
    specifications: Optional[str] = Field(default=None, max_length=700)

class RFQItemCreate(RFQItemBase):
    pass

class RFQItemResponse(RFQItemBase):
    id: int
    rfq_id: int

    class Config:
        from_attributes = True

class RFQBase(BaseModel):
    title: str = Field(..., min_length=4, max_length=160)
    description: str = Field(..., min_length=10, max_length=1500)
    deadline: datetime
    status: Optional[str] = "DRAFT"

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, value: datetime) -> datetime:
        if value <= datetime.utcnow():
            raise ValueError("Deadline must be in the future")
        return value

    @field_validator("status")
    @classmethod
    def validate_rfq_status(cls, value: Optional[str]) -> str:
        normalized = (value or "DRAFT").upper()
        if normalized not in {"DRAFT", "OPEN", "CLOSED", "CANCELLED"}:
            raise ValueError("RFQ status must be DRAFT, OPEN, CLOSED, or CANCELLED")
        return normalized

class RFQAttachment(BaseModel):
    name: str = Field(..., min_length=1, max_length=180)
    size: int = Field(..., ge=0)
    type: Optional[str] = Field(default=None, max_length=120)

class RFQCreate(RFQBase):
    items: List[RFQItemCreate] = Field(..., min_length=1)
    vendor_ids: List[int] = Field(..., min_length=1) # List of Vendor IDs to invite
    attachments: List[RFQAttachment] = []

class RFQResponse(RFQBase):
    id: int
    created_by_id: int
    created_at: datetime
    items: List[RFQItemResponse] = []
    vendor_ids: List[int] = []
    attachments: List[RFQAttachment] = []

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

class InvoiceCreate(BaseModel):
    po_id: int
    subtotal: float
    tax_percent: float = 18.0

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
