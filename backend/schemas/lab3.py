from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.images import Frame


class ContrastSettings(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    mode: Literal["grayscale", "color"] = "grayscale"
    clip_limit: Annotated[float, Field(strict=True, gt=0, le=40)] = 2.0
    tiles_x: Annotated[int, Field(strict=True, ge=1, le=16)] = 8
    tiles_y: Annotated[int, Field(strict=True, ge=1, le=16)] = 8
    linear_method: Literal["adjust", "stretch"] = "adjust"
    alpha: Annotated[float, Field(strict=True, ge=0, le=10)] = 1.2
    beta: Annotated[int, Field(strict=True, ge=-255, le=255)] = 0


class IntensityStatistics(BaseModel):
    minimum: int
    maximum: int
    mean: float
    standard_deviation: float
    occupied_bins: int


class ContrastView(BaseModel):
    frame: Frame
    histogram: list[int]
    statistics: IntensityStatistics


class LinearTransform(BaseModel):
    scale: float
    offset: float
    note: str


class ContrastResult(BaseModel):
    original: ContrastView
    equalized: ContrastView
    clahe: ContrastView
    linear: ContrastView
    parameters: ContrastSettings
    channel: Literal["Grayscale intensity", "Y brightness (YUV)"]
    linear_transform: LinearTransform
    engine: str
    notes: list[str]
