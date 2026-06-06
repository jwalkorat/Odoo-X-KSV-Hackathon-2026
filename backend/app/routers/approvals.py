from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from ..database import get_db
from ..models import Approval, PurchaseOrder, Quotation, RFQ
from ..schemas import ApprovalCreate, ApprovalResponse, ApprovalResolve, PurchaseOrderResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

manager_only = RoleChecker(["MANAGER", "ADMIN"])
officer_or_admin = RoleChecker(["OFFICER", "ADMIN"])

@router.get("/", response_model=List[ApprovalResponse])
def get_approvals(status: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(Approval)
    if status:
        query = query.filter(Approval.status == status)
    return query.all()

@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(approval_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return approval

@router.post("/", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
def request_approval(
    approval_in: ApprovalCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(officer_or_admin)
):
    # Check if quotation exists
    quote = db.query(Quotation).filter(Quotation.id == approval_in.quotation_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    db_approval = Approval(
        rfq_id=approval_in.rfq_id,
        quotation_id=approval_in.quotation_id,
        requested_by_id=current_user.id,
        status="PENDING"
    )
    db.add(db_approval)
    db.commit()
    db.refresh(db_approval)
    return db_approval

@router.post("/{approval_id}/resolve", response_model=ApprovalResponse)
def resolve_approval(
    approval_id: int,
    resolve_in: ApprovalResolve,
    db: Session = Depends(get_db),
    current_user = Depends(manager_only)
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail="Approval request already resolved")

    approval.status = resolve_in.status.upper()
    approval.remarks = resolve_in.remarks
    approval.approved_by_id = current_user.id
    approval.resolved_at = datetime.datetime.utcnow()

    if approval.status == "APPROVED":
        # Create Purchase Order
        # Generate PO number: PO-YYYY-XXXX (where XXXX is a incrementing number)
        year = datetime.datetime.utcnow().year
        po_count = db.query(PurchaseOrder).count() + 1
        po_number = f"PO-{year}-{po_count:04d}"
        
        quote = db.query(Quotation).filter(Quotation.id == approval.quotation_id).first()
        
        db_po = PurchaseOrder(
            po_number=po_number,
            rfq_id=approval.rfq_id,
            quotation_id=approval.quotation_id,
            vendor_id=quote.vendor_id if quote else 1,
            status="ISSUED",
            total_amount=quote.total_amount if quote else 0.0
        )
        db.add(db_po)
        
        # Close the RFQ
        rfq = db.query(RFQ).filter(RFQ.id == approval.rfq_id).first()
        if rfq:
            rfq.status = "CLOSED"

    db.commit()
    db.refresh(approval)
    return approval
