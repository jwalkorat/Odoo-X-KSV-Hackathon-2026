import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Procurement Galaxy API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "galactic_super_secret_quantum_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours - perfect for the hackathon
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/procurement_galaxy")

    class Config:
        case_sensitive = True

settings = Settings()
