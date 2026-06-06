from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from ..models import Vendor
from ..schemas import VendorCreate, VendorResponse, VendorStatusUpdate
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/vendors", tags=["Vendors"])

# Role check shortcut (Procurement Officer or Admin can manage)
officer_or_admin = RoleChecker(["OFFICER", "ADMIN", "MANAGER"])

@router.get("/", response_model=List[VendorResponse])
def get_vendors(
    category: Optional[str] = None, 
    status: Optional[str] = None, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Vendor)
    if category:
        query = query.filter(Vendor.category == category)
    if status:
        query = query.filter(Vendor.status == status.upper())
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Vendor.name.ilike(like),
                Vendor.category.ilike(like),
                Vendor.gst_number.ilike(like),
                Vendor.contact_email.ilike(like),
            )
        )
    return query.order_by(Vendor.created_at.desc()).all()

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor_in: VendorCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(officer_or_admin)
):
    # Check if GST is unique
    existing = db.query(Vendor).filter(Vendor.gst_number == vendor_in.gst_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor with this GST number already registered")
        
    db_vendor = Vendor(**vendor_in.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.patch("/{vendor_id}/status", response_model=VendorResponse)
def update_vendor_status(
    vendor_id: int,
    status_in: VendorStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(officer_or_admin),
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.status = status_in.status
    db.commit()
    db.refresh(vendor)
    return vendor
