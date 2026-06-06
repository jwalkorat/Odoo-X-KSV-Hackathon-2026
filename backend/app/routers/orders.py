from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from ..database import get_db
from ..models import PurchaseOrder, Invoice
from ..schemas import PurchaseOrderResponse, InvoiceResponse, InvoiceCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Purchase Orders & Invoices"])

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Vendors should only see their own POs
    if current_user.role == "VENDOR":
        # Hackathon shortcut - filter by vendor_id matching user.id or handle in logic
        return db.query(PurchaseOrder).filter(PurchaseOrder.vendor_id == current_user.id).all()
    return db.query(PurchaseOrder).all()

@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == "VENDOR":
        return db.query(Invoice).filter(Invoice.vendor_id == current_user.id).all()
    return db.query(Invoice).all()

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verify PO exists
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == invoice_in.po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    year = datetime.datetime.utcnow().year
    inv_count = db.query(Invoice).count() + 1
    invoice_number = f"INV-{year}-{inv_count:04d}"

    subtotal = invoice_in.subtotal
    tax_amount = subtotal * (invoice_in.tax_percent / 100.0)
    total = subtotal + tax_amount

    db_inv = Invoice(
        invoice_number=invoice_number,
        po_id=invoice_in.po_id,
        vendor_id=po.vendor_id,
        subtotal=subtotal,
        tax_percent=invoice_in.tax_percent,
        tax_amount=tax_amount,
        total=total,
        status="DRAFT"
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

# Schema imports for route signature validation compatibility
from pydantic import BaseModel
class InvoiceCreate(BaseModel):
    po_id: int
    subtotal: float
    tax_percent: float = 18.0
