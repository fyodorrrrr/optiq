from fastapi import APIRouter, HTTPException
from routers.image_io import process
from schemas.lab5 import DatasetInfo, Result, Settings
from services.lab5 import DatasetUnavailable, execute, status
from services.public_metadata import public_message

router = APIRouter(prefix='/api/labs/5', tags=['Lab 5'])


@router.get('/dataset', response_model=DatasetInfo)
async def dataset():
    return await process(status)


@router.post('/experiment', response_model=Result)
async def experiment(settings: Settings):
    try:
        return await process(execute, settings)
    except DatasetUnavailable as error:
        raise HTTPException(503, public_message(str(error))) from None
