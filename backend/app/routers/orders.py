from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from ..database import get_db
from ..models import PurchaseOrder, Invoice, Vendor, ActivityLog
from ..schemas import PurchaseOrderResponse, InvoiceResponse, InvoiceCreate, PurchaseOrderStatusUpdate, InvoiceStatusUpdate
from ..auth import get_current_user
from ..email_service import send_invoice_email

router = APIRouter(prefix="/api/orders", tags=["Purchase Orders & Invoices"])


def populate_po_details(po: PurchaseOrder) -> PurchaseOrder:
    po.vendor_name = po.vendor.name if po.vendor else None
    po.rfq_title = po.rfq.title if po.rfq else None
    return po


def populate_invoice_details(inv: Invoice) -> Invoice:
    inv.vendor_name = inv.vendor.name if inv.vendor else None
    inv.po_number = inv.purchase_order.po_number if inv.purchase_order else None
    return inv


# ─── Purchase Orders ────────────────────────────────────────────────────────

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "VENDOR":
        pos = db.query(PurchaseOrder).filter(PurchaseOrder.vendor_id == current_user.id).all()
    else:
        pos = db.query(PurchaseOrder).all()
    return [populate_po_details(po) for po in pos]


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return populate_po_details(po)


@router.patch("/purchase-orders/{po_id}/status", response_model=PurchaseOrderResponse)
def update_po_status(
    po_id: int,
    update_in: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    allowed = {"DRAFT", "ISSUED", "COMPLETED"}
    new_status = update_in.status.upper()
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    po.status = new_status
    db.commit()
    db.refresh(po)
    return populate_po_details(po)


# ─── Invoices ───────────────────────────────────────────────────────────────

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "VENDOR":
        invoices = db.query(Invoice).filter(Invoice.vendor_id == current_user.id).all()
    else:
        invoices = db.query(Invoice).all()
    return [populate_invoice_details(inv) for inv in invoices]


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return populate_invoice_details(inv)


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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
        status="DRAFT",
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return populate_invoice_details(db_inv)


@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: int,
    update_in: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    allowed = {"DRAFT", "SENT", "PAID"}
    new_status = update_in.status.upper()
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    inv.status = new_status
    if new_status == "SENT":
        inv.sent_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(inv)
    return populate_invoice_details(inv)


@router.post("/invoices/{invoice_id}/email")
def email_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Send the invoice as a real HTML email via Gmail SMTP to the vendor's registered email.
    Marks the invoice as SENT and logs the action.
    """
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Fetch vendor to get their real email address
    vendor = db.query(Vendor).filter(Vendor.id == inv.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found for this invoice")

    vendor_email = vendor.contact_email
    vendor_name = vendor.name

    # Enrich the invoice object with names for the email template
    inv.vendor_name = vendor_name  # transient attr for template
    po = inv.purchase_order if hasattr(inv, "purchase_order") else None
    inv.po_number = po.po_number if po else f"PO-{inv.po_id}"

    # Send the real email
    result = send_invoice_email(inv, vendor_email, vendor_name)

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Email delivery failed: {result['error']}"
        )

    # Update invoice status to SENT
    inv.status = "SENT"
    inv.sent_at = datetime.datetime.utcnow()

    # Log the action
    log = ActivityLog(
        user_id=current_user.id,
        action="Emailed Invoice",
        entity_type="Invoice",
        entity_id=invoice_id,
        metadata_json=(
            f'{{"invoice_number": "{inv.invoice_number}", '
            f'"sent_to": "{vendor_email}", '
            f'"vendor": "{vendor_name}"}}'
        ),
    )
    db.add(log)
    db.commit()
    db.refresh(inv)

    return {
        "success": True,
        "message": f"Invoice {inv.invoice_number} emailed to {vendor_email} ({vendor_name}) successfully.",
        "invoice_number": inv.invoice_number,
        "sent_to": vendor_email,
        "sent_at": inv.sent_at.isoformat(),
    }
