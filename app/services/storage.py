"""
app/services/storage.py

File upload service using Cloudinary.
Handles:
  1. Photo uploads (UploadFile from multipart form)
  2. Base64-encoded signature uploads

Cloudinary credentials are loaded from settings (never hard-coded).
"""
from __future__ import annotations

import base64
import io
import uuid

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings


def _configure_cloudinary() -> None:
    """Configure Cloudinary SDK once using env credentials."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


# Configure on module import
_configure_cloudinary()


async def upload_image(file: UploadFile, order_id: uuid.UUID) -> str:
    """
    Upload a PoD photo to Cloudinary.

    Args:
        file:     FastAPI UploadFile from the multipart request.
        order_id: Used as the Cloudinary public_id for easy retrieval.

    Returns:
        Cloudinary secure HTTPS URL.

    Raises:
        RuntimeError: If the Cloudinary upload fails.
    """
    contents = await file.read()

    result = cloudinary.uploader.upload(
        contents,
        folder="logicore/pod",
        public_id=f"order_{order_id}",
        overwrite=True,
        resource_type="image",
        tags=["proof_of_delivery"],
    )
    url: str = result.get("secure_url", "")
    if not url:
        raise RuntimeError(f"Cloudinary upload failed for order {order_id}")
    return url


async def upload_signature(
    b64_data: str,
    order_id: uuid.UUID,
) -> str:
    """
    Upload a base64-encoded signature image to Cloudinary.

    Args:
        b64_data: Base64 string (with or without data URI prefix).
        order_id: Used as the Cloudinary public_id.

    Returns:
        Cloudinary secure HTTPS URL.
    """
    # Strip optional data URI prefix
    if "," in b64_data:
        b64_data = b64_data.split(",", 1)[1]

    image_bytes = base64.b64decode(b64_data)

    result = cloudinary.uploader.upload(
        io.BytesIO(image_bytes),
        folder="logicore/signatures",
        public_id=f"sig_order_{order_id}",
        overwrite=True,
        resource_type="image",
        tags=["signature"],
    )
    url: str = result.get("secure_url", "")
    if not url:
        raise RuntimeError(f"Cloudinary signature upload failed for order {order_id}")
    return url
