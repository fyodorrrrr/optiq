from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from routers.image_io import load_image, process, read_upload
from schemas.images import Frame
from schemas.lab3 import ContrastResult, ContrastSettings
from services.lab3 import execute, sample_image

router = APIRouter(prefix="/api/labs/3", tags=["Lab 3"])


@router.get("/sample", response_model=Frame)
async def sample(kind: Literal["mascot", "low-contrast", "uneven", "color"] = "low-contrast"):
    return await process(sample_image, kind)


@router.post("/load", response_model=Frame)
async def load(file: Annotated[UploadFile, File()]):
    return await process(load_image, await read_upload(file))


@router.post("/experiment", response_model=ContrastResult)
async def experiment(file: Annotated[UploadFile, File()], settings: Annotated[str, Form(max_length=4096)]):
    content = await read_upload(file)
    try:
        parameters = ContrastSettings.model_validate_json(settings)
    except ValidationError:
        raise HTTPException(422, "Check the processing mode, CLAHE clip limit (0–40, greater than 0), tile counts (1–16), scale (0–10), and integer offset (−255 to 255).") from None
    return await process(execute, content, parameters)
