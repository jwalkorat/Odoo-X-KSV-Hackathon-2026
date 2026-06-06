import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import RFQ, RFQItem, RFQVendor, Quotation, QuotationItem, Vendor
from ..schemas import RFQCreate, RFQResponse, QuotationCreate, QuotationResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/rfqs", tags=["RFQs & Quotations"])

officer_or_admin = RoleChecker(["OFFICER", "ADMIN"])
vendor_only = RoleChecker(["VENDOR"])

def serialize_rfq(rfq: RFQ) -> RFQ:
    rfq.vendor_ids = [link.vendor_id for link in rfq.vendor_links]
    try:
        rfq.attachments = json.loads(rfq.attachments_json or "[]")
    except json.JSONDecodeError:
        rfq.attachments = []
    return rfq

@router.get("/", response_model=List[RFQResponse])
def get_rfqs(status: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # If user is a Vendor, they should only see RFQs they are invited to
    if current_user.role == "VENDOR":
        # Find vendor link
        # For hackathon simplicity, let's join
        query = db.query(RFQ).join(RFQVendor).filter(RFQVendor.vendor_id == current_user.id) # Assuming user.id corresponds to vendor_id or mock it
        # Note: In production you'd map user profile to vendor_id.
    else:
        query = db.query(RFQ)
        
    if status:
        query = query.filter(RFQ.status == status.upper())
    return [serialize_rfq(rfq) for rfq in query.order_by(RFQ.created_at.desc()).all()]

@router.get("/{rfq_id}", response_model=RFQResponse)
def get_rfq(rfq_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return serialize_rfq(rfq)

@router.post("/", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
def create_rfq(
    rfq_in: RFQCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(officer_or_admin)
):
    vendors = db.query(Vendor).filter(Vendor.id.in_(rfq_in.vendor_ids)).all()
    found_vendor_ids = {vendor.id for vendor in vendors}
    missing_vendor_ids = [vendor_id for vendor_id in rfq_in.vendor_ids if vendor_id not in found_vendor_ids]
    if missing_vendor_ids:
        raise HTTPException(status_code=400, detail=f"Unknown vendor ids: {missing_vendor_ids}")

    inactive_vendors = [vendor.name for vendor in vendors if vendor.status != "ACTIVE"]
    if inactive_vendors:
        raise HTTPException(status_code=400, detail=f"Only active vendors can be assigned: {', '.join(inactive_vendors)}")

    # Create RFQ header
    db_rfq = RFQ(
        title=rfq_in.title,
        description=rfq_in.description,
        deadline=rfq_in.deadline,
        status=rfq_in.status,
        attachments_json=json.dumps([attachment.model_dump() for attachment in rfq_in.attachments]),
        created_by_id=current_user.id
    )
    db.add(db_rfq)
    db.commit()
    db.refresh(db_rfq)

    # Create Line Items
    for item in rfq_in.items:
        db_item = RFQItem(
            rfq_id=db_rfq.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit=item.unit,
            specifications=item.specifications
        )
        db.add(db_item)

    # Invite Vendors
    for v_id in rfq_in.vendor_ids:
        db_link = RFQVendor(
            rfq_id=db_rfq.id,
            vendor_id=v_id,
            status="PENDING"
        )
        db.add(db_link)

    db.commit()
    db.refresh(db_rfq)
    return serialize_rfq(db_rfq)

@router.post("/{rfq_id}/quotes", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def submit_quotation(
    rfq_id: int,
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # In hackathon, user role checked
):
    # Verify RFQ exists
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
        
    db_quote = Quotation(
        rfq_id=rfq_id,
        vendor_id=quote_in.vendor_id,
        total_amount=quote_in.total_amount,
        delivery_days=quote_in.delivery_days,
        notes=quote_in.notes,
        status="SUBMITTED"
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)

    for item in quote_in.items:
        db_item = QuotationItem(
            quotation_id=db_quote.id,
            rfq_item_id=item.rfq_item_id,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        db.add(db_item)

    # Update RFQ-Vendor status
    link = db.query(RFQVendor).filter(RFQVendor.rfq_id == rfq_id, RFQVendor.vendor_id == quote_in.vendor_id).first()
    if link:
        link.status = "RESPONDED"

    db.commit()
    db.refresh(db_quote)
    return db_quote
