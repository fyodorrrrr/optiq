from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from routers.image_io import process, read_upload
from schemas.images import Frame
from schemas.lab2 import EdgeResult, EdgeSettings
from services.lab2 import execute, load_grayscale, sample_image

router = APIRouter(prefix="/api/labs/2", tags=["Lab 2"])


@router.get("/sample", response_model=Frame)
async def sample(kind: Literal["shapes", "noisy"] = "shapes"):
    return await process(sample_image, kind)


@router.post("/load", response_model=Frame)
async def load(file: Annotated[UploadFile, File()]):
    return await process(load_grayscale, await read_upload(file))


@router.post("/experiment", response_model=EdgeResult)
async def experiment(file: Annotated[UploadFile, File()], settings: Annotated[str, Form(max_length=4096)]):
    content = await read_upload(file)
    try:
        parameters = EdgeSettings.model_validate_json(settings)
    except ValidationError:
        raise HTTPException(422, "Use odd kernels (blur 1–9, Sobel 3–7) and whole-number thresholds with 0 ≤ lower < upper ≤ 2048.") from None
    return await process(execute, content, parameters)
