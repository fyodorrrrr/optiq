from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from routers.image_io import process, read_upload
from schemas.images import Frame
from schemas.lab4 import Capabilities, FeatureComparison, FeatureSettings, SamplePair
from services.lab4 import capabilities, execute, load_image, sample_pair

router = APIRouter(prefix="/api/labs/4", tags=["Lab 4"])


@router.get("/capabilities", response_model=Capabilities)
async def available_algorithms():
    # This small capability probe does not decode images or run an experiment.
    return await process(capabilities, limited=False)


@router.get("/sample", response_model=SamplePair)
async def sample(kind: Literal["rotated", "scaled"] = "rotated"):
    return await process(sample_pair, kind)


@router.post("/load", response_model=Frame)
async def load(file: Annotated[UploadFile, File()]):
    return await process(load_image, await read_upload(file))


@router.post("/experiment", response_model=FeatureComparison)
async def experiment(first: Annotated[UploadFile, File()], second: Annotated[UploadFile, File()], settings: Annotated[str, Form(max_length=4096)]):
    try:
        first_content = await read_upload(first)
        second_content = await read_upload(second)
    finally:
        await first.close()
        await second.close()
    try:
        parameters = FeatureSettings.model_validate_json(settings)
    except ValidationError:
        raise HTTPException(422, "Check Hessian threshold (0–100000, greater than 0), ratio (between 0 and 1), feature limit (1–1000), displayed matches (1–100), and upright mode.") from None
    return await process(execute, first_content, second_content, parameters)
