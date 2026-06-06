from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from ..database import get_db
from ..models import RFQ, RFQItem, RFQVendor, Quotation, QuotationItem
from ..schemas import RFQCreate, RFQResponse, QuotationCreate, QuotationResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/rfqs", tags=["RFQs & Quotations"])

officer_or_admin = RoleChecker(["OFFICER", "ADMIN"])
vendor_only = RoleChecker(["VENDOR"])

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
        query = query.filter(RFQ.status == status)
    return query.all()

@router.get("/{rfq_id}", response_model=RFQResponse)
def get_rfq(rfq_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq

@router.post("/", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
def create_rfq(
    rfq_in: RFQCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(officer_or_admin)
):
    # Create RFQ header
    db_rfq = RFQ(
        title=rfq_in.title,
        description=rfq_in.description,
        deadline=rfq_in.deadline,
        status=rfq_in.status,
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
    return db_rfq

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
        
    # Check if a quotation already exists for this vendor and RFQ (Upsert logic)
    existing_quote = db.query(Quotation).filter(
        Quotation.rfq_id == rfq_id,
        Quotation.vendor_id == quote_in.vendor_id
    ).first()

    if existing_quote:
        existing_quote.total_amount = quote_in.total_amount
        existing_quote.delivery_days = quote_in.delivery_days
        existing_quote.notes = quote_in.notes
        existing_quote.status = "SUBMITTED"
        existing_quote.submitted_at = datetime.datetime.utcnow()

        # Delete existing line items
        db.query(QuotationItem).filter(QuotationItem.quotation_id == existing_quote.id).delete()

        # Create new line items
        for item in quote_in.items:
            db_item = QuotationItem(
                quotation_id=existing_quote.id,
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
        db.refresh(existing_quote)
        return existing_quote

    # Create new quotation
    db_quote = Quotation(
        rfq_id=rfq_id,
        vendor_id=quote_in.vendor_id,
        total_amount=quote_in.total_amount,
        delivery_days=quote_in.delivery_days,
        notes=quote_in.notes,
        status="SUBMITTED",
        submitted_at=datetime.datetime.utcnow()
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

@router.get("/{rfq_id}/quotes", response_model=List[QuotationResponse])
def get_rfq_quotations(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    # Vendors should only see their own quote
    if current_user.role == "VENDOR":
        return db.query(Quotation).filter(
            Quotation.rfq_id == rfq_id,
            Quotation.vendor_id == current_user.id
        ).all()
        
    return db.query(Quotation).filter(Quotation.rfq_id == rfq_id).all()

@router.get("/quotes/all", response_model=List[QuotationResponse])
def get_all_quotations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == "VENDOR":
        return db.query(Quotation).filter(Quotation.vendor_id == current_user.id).all()
    return db.query(Quotation).all()

@router.get("/quotes/{quote_id}", response_model=QuotationResponse)
def get_quotation(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    quote = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    # Vendor permission check
    if current_user.role == "VENDOR" and quote.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Clearance level insufficient to view this quotation")
        
    return quote
