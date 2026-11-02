from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from schemas.lab1 import ExperimentResult, Frame, experiment_adapter
from services.images import MAX_BYTES, ImageError, decode_image, frame, sample_image
from services.lab1 import execute

router = APIRouter(prefix="/api/labs/1", tags=["Lab 1"])


async def read_upload(file):
    try:
        if file.content_type not in {"image/png", "image/jpeg"}:
            raise HTTPException(415, "Choose a PNG or JPEG image.")
        content = await file.read(MAX_BYTES + 1)
        if len(content) > MAX_BYTES:
            raise HTTPException(413, "Choose an image no larger than 5 MiB.")
        return content
    finally:
        await file.close()


async def process(function, *args):
    try:
        return await run_in_threadpool(function, *args)
    except ImageError as error:
        raise HTTPException(error.status, str(error)) from None


def load_image(content):
    image, notes = decode_image(content)
    return frame(image, notes)


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
