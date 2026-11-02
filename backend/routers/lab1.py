from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from schemas.lab1 import ExperimentResult, Frame, experiment_adapter
from services.images import sample_image
from routers.image_io import load_image, process, read_upload
from services.lab1 import execute

router = APIRouter(prefix="/api/labs/1", tags=["Lab 1"])


@router.get("/sample", response_model=Frame)
async def sample(kind: Literal["color", "grayscale"] = "color"):
    return await process(sample_image, kind)


@router.post("/load", response_model=Frame)
async def load(file: Annotated[UploadFile, File()]):
    return await process(load_image, await read_upload(file))


@router.post("/experiment", response_model=ExperimentResult)
async def experiment(file: Annotated[UploadFile, File()], settings: Annotated[str, Form(max_length=4096)]):
    content = await read_upload(file)
    try:
        parameters = experiment_adapter.validate_json(settings)
    except ValidationError:
        raise HTTPException(422, "Invalid operation settings. Check coordinates, dimensions, and color values.") from None
    return await process(execute, content, parameters)
