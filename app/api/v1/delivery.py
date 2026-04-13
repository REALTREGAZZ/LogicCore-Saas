"""
app/api/v1/delivery.py

Proof-of-Delivery (PoD) endpoints.
  POST /delivery/{order_id}/pod — Upload photo + optional signature
  GET  /delivery/{order_id}/pod — Retrieve PoD record
"""
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.order import Order
from app.models.proof_of_delivery import ProofOfDelivery
from app.models.user import User
from app.schemas.delivery import PoDResponse
from app.services.storage import upload_image, upload_signature

router = APIRouter(prefix="/delivery", tags=["Proof of Delivery"])


@router.post(
    "/{order_id}/pod",
    response_model=PoDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Proof of Delivery — photo image + optional digital signature",
)
async def upload_pod(
    order_id: uuid.UUID,
    photo: UploadFile = File(..., description="Delivery confirmation photo"),
    signature_data: str | None = Form(default=None, description="Base64 signature"),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PoDResponse:
    # Verify the order belongs to this tenant
    order_result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.tenant_id == current_user.tenant_id,
        )
    )
    order: Order | None = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status == "delivered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order is already marked as delivered.",
        )

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if photo.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Image type '{photo.content_type}' not supported. Use JPEG, PNG, or WebP.",
        )

    # Upload photo to Cloudinary
    image_url = await upload_image(photo, order_id)

    # Create PoD record
    pod = ProofOfDelivery(
        tenant_id=current_user.tenant_id,
        order_id=order_id,
        delivered_by=current_user.id,
        image_url=image_url,
        signature_data=signature_data,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(pod)

    # Update order status to delivered
    order.status = "delivered"
    await db.flush()

    return PoDResponse.model_validate(pod)


@router.get(
    "/{order_id}/pod",
    response_model=PoDResponse,
    summary="Retrieve the Proof of Delivery for an order",
)
async def get_pod(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PoDResponse:
    result = await db.execute(
        select(ProofOfDelivery).where(
            ProofOfDelivery.order_id == order_id,
            ProofOfDelivery.tenant_id == current_user.tenant_id,
        )
    )
    pod = result.scalar_one_or_none()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Proof of Delivery found for this order.",
        )
    return PoDResponse.model_validate(pod)
