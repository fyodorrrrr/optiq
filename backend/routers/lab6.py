from typing import Annotated, Literal
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from services import lab6
from pydantic import ValidationError
from routers.image_io import load_image, process, read_upload
from schemas.images import Frame
from schemas.lab6 import Result, Settings, Status
from services.lab6 import execute, sample, status
from services.public_metadata import public_log

router = APIRouter(prefix='/api/labs/6', tags=['Lab 6'])


@router.get('/status', response_model=Status)
async def model_status():
    return await process(status)


@router.get('/sample', response_model=Frame)
async def sample_image(kind: Literal['bus', 'bottle'] = 'bus'):
    return await process(sample, kind)


@router.post('/load', response_model=Frame)
async def load(file: Annotated[UploadFile, File()]):
    return await process(load_image, await read_upload(file))


@router.post('/experiment', response_model=Result)
async def experiment(file: Annotated[UploadFile, File()], settings: Annotated[str, Form(max_length=4096)]):
    content = await read_upload(file)
    try:
        parameters = Settings.model_validate_json(settings)
    except ValidationError:
        raise HTTPException(422, 'Choose a supported model and confidence greater than 0 and at most 1.') from None
    return await process(execute, content, parameters)


@router.get('/artifacts/{kind}')
async def artifact(kind: Literal['log']):
    path = lab6.ROOT / 'training.log'
    if not path.is_file():
        raise HTTPException(404, 'No local training log is available yet.')
    return PlainTextResponse(public_log(path.read_text(errors='replace')),
                             headers={'Content-Disposition': 'attachment; filename="optiq-lab6-training.log"'})
