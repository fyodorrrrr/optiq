from typing import Annotated, Literal
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from routers.image_io import process, read_upload
from schemas.images import Frame
from schemas.lab7 import Result, Settings
from services.lab7 import execute, load_image, sample
from services.lab7_semantic import status

router=APIRouter(prefix='/api/labs/7',tags=['Lab 7'])


@router.get('/status')
async def model_status():
    # This probe checks availability without loading the semantic model.
    return await process(status, limited=False)


@router.get('/sample',response_model=Frame)
async def sample_image(kind: Literal['touching','uneven','contours','scene']='touching'):
    return await process(sample,kind)


@router.post('/load',response_model=Frame)
async def load(file: Annotated[UploadFile,File()]):
    return await process(load_image,await read_upload(file))


@router.post('/experiment',response_model=Result)
async def experiment(file: Annotated[UploadFile,File()],settings: Annotated[str,Form(max_length=4096)]):
    content=await read_upload(file)
    try:
        parameters=Settings.model_validate_json(settings)
    except ValidationError:
        raise HTTPException(422,'Check numeric bounds, odd neighborhood sizes, and increasing Canny thresholds.') from None
    return await process(execute,content,parameters)
