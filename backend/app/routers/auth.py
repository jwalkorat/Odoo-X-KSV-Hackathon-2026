from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import random
import string
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, Token
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user
from ..email_service import send_forgot_password_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        role=user_in.role.upper(),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone_number=user_in.phone_number,
        country=user_in.country,
        additional_info=user_in.additional_info,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Password Reset (real OTP via Gmail) ────────────────────────────────────
# In-memory store: { username -> otp_string }
_otp_store: dict = {}


def _generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    """
    Generate a real 6-digit OTP and email it to the user's registered address.
    Raises HTTP 500 if SMTP delivery fails.
    """
    username = payload.get("username", "").strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="No pilot found with that username")

    otp = _generate_otp(6)
    _otp_store[username] = otp

    result = send_forgot_password_email(
        to_email=user.email,
        username=user.username,
        otp=otp
    )

    if not result["success"]:
        _otp_store.pop(username, None)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send recovery email: {result['error']}"
        )

    # Show a partial email hint (privacy)
    at_idx = user.email.index("@")
    hint = user.email[:3] + "****" + user.email[at_idx:]

    return {
        "success": True,
        "message": f"Recovery code sent to {hint}. Please check your inbox.",
        "email_hint": hint,
    }


@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    """
    Validate the OTP received by email, then update the user's password.
    """
    username = payload.get("username", "").strip()
    otp = payload.get("otp", "").strip()
    new_password = payload.get("new_password", "")

    if not username or not otp or not new_password:
        raise HTTPException(status_code=400, detail="username, otp, and new_password are required")

    stored = _otp_store.get(username)
    if not stored or stored != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired recovery code")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pilot not found")

    user.hashed_password = get_password_hash(new_password)
    db.commit()
    del _otp_store[username]

    return {"message": "Security code updated successfully. You may now log in.", "success": True}
