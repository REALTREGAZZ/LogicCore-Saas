"""
app/schemas/auth.py
Pydantic schemas for authentication and tenant registration.
"""
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class TenantCreate(BaseModel):
    """Register a new company (tenant) with its first dispatcher account."""
    company_name: str = Field(..., min_length=2, max_length=255)
    company_slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9\-]+$")
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    admin_full_name: str = Field(..., min_length=2, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    tenant_id: UUID
    role: str


class UserResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
