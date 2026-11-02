from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool

from services.images import MAX_BYTES, ImageError, decode_image, frame


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
