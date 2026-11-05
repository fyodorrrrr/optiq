from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool

from services.images import MAX_BYTES, ImageError, decode_image, frame
from services.public_metadata import public_message
from services.processing_limits import ProcessingBusy, processing_limiter


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


async def process(function, *args, limited=True):
    try:
        slot = processing_limiter.reserve() if limited else None
    except ProcessingBusy as error:
        raise HTTPException(503, str(error), headers={'Retry-After': '2'}) from None
    try:
        if slot is None:
            return await run_in_threadpool(function, *args)
        return await run_in_threadpool(slot.run, function, *args)
    except ImageError as error:
        raise HTTPException(error.status, public_message(str(error))) from None
    finally:
        # Queued cancellation releases immediately; running work releases in its worker.
        if slot is not None:
            slot.cancel_if_pending()


def load_image(content):
    image, notes = decode_image(content)
    return frame(image, notes)
