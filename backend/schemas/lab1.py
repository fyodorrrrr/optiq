from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from schemas.images import Frame

Coordinate = Annotated[int, Field(strict=True, ge=0, le=4095)]
Dimension = Annotated[int, Field(strict=True, ge=1, le=4096)]
Byte = Annotated[int, Field(strict=True, ge=0, le=255)]


class Settings(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Inspect(Settings):
    operation: Literal["inspect"]
    x: Coordinate
    y: Coordinate


class Edit(Settings):
    operation: Literal["edit"]
    x: Coordinate
    y: Coordinate
    color: tuple[Byte, Byte, Byte] | None = None
    intensity: Byte | None = None


class Grayscale(Settings):
    operation: Literal["grayscale"]


class Crop(Settings):
    operation: Literal["crop"]
    x: Coordinate
    y: Coordinate
    width: Dimension
    height: Dimension


class Resize(Settings):
    operation: Literal["resize"]
    width: Dimension
    height: Dimension
    interpolation: Literal["nearest", "linear", "area"] = "linear"


class Rotate(Settings):
    operation: Literal["rotate"]
    quarter_turns: Annotated[int, Field(strict=True, ge=0, le=3)] = 1


Experiment = Annotated[Inspect | Edit | Grayscale | Crop | Resize | Rotate, Field(discriminator="operation")]
experiment_adapter = TypeAdapter(Experiment)


class PixelValue(BaseModel):
    bgr: list[int] | None = None
    rgb: list[int] | None = None
    intensity: int | None = None


class PixelResult(BaseModel):
    x: int
    y: int
    before: PixelValue
    after: PixelValue
    before_zoom: str
    after_zoom: str


class ExperimentResult(BaseModel):
    result: Frame
    pixel: PixelResult | None = None
    operation: str
    parameters: dict
    engine: str
