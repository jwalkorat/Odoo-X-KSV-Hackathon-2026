from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, vendors, rfqs, approvals, orders, logs

# Automatically create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Procurement Galaxy API",
    description="Quantum Cyber B2B Procurement ERP Backend",
    version="1.0.0"
)

# CORS configuration for frontend react app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in hackathon for easy connectivity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(rfqs.router)
app.include_router(approvals.router)
app.include_router(orders.router)
app.include_router(logs.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Procurement Galaxy ERP Command Deck API",
        "documentation": "/docs"
    }
