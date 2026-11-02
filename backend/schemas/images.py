from typing import Literal

from pydantic import BaseModel


class Frame(BaseModel):
    image: str
    width: int
    height: int
    channels: int
    shape: list[int]
    dtype: str
    color_space: Literal["BGR", "Grayscale"]
    notes: list[str]
