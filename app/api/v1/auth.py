"""
app/api/v1/auth.py

Authentication endpoints:
  POST /auth/register — Create a new tenant + first dispatcher account
  POST /auth/login    — Return JWT access token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import LoginRequest, TenantCreate, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new company (tenant) with an admin dispatcher account",
)
async def register_tenant(
    body: TenantCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # Check slug uniqueness
    existing = await db.execute(
        select(Tenant).where(Tenant.slug == body.company_slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Company slug '{body.company_slug}' is already taken.",
        )

    # Check email uniqueness
    existing_user = await db.execute(
        select(User).where(User.email == body.admin_email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered.",
        )

    # Create tenant
    tenant = Tenant(name=body.company_name, slug=body.company_slug)
    db.add(tenant)
    await db.flush()  # Get tenant.id before creating the user

    # Create first dispatcher
    user = User(
        tenant_id=tenant.id,
        email=body.admin_email,
        hashed_password=get_password_hash(body.admin_password),
        full_name=body.admin_full_name,
        role="dispatcher",
    )
    db.add(user)
    await db.flush()

    token = create_access_token(
        subject=str(user.id),
        tenant_id=tenant.id,
        role=user.role,
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        tenant_id=tenant.id,
        role=user.role,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT access token",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    token = create_access_token(
        subject=str(user.id),
        tenant_id=user.tenant_id,
        role=user.role,
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        tenant_id=user.tenant_id,
        role=user.role,
    )
