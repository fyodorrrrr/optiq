from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from schemas.images import Frame


class Settings(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    method: Literal['threshold', 'region', 'edges', 'semantic'] = 'threshold'
    invert: bool = Field(default=False, strict=True)
    adaptive_block: int = Field(default=31, strict=True, ge=3, le=101)
    adaptive_c: int = Field(default=5, strict=True, ge=-30, le=30)
    seed_x: int = Field(default=170, strict=True, ge=0, le=4095)
    seed_y: int = Field(default=180, strict=True, ge=0, le=4095)
    tolerance: int = Field(default=20, strict=True, ge=0, le=255)
    watershed_fraction: float = Field(default=.7, strict=True, ge=.1, le=.95)
    canny_low: int = Field(default=60, strict=True, ge=0, le=254)
    canny_high: int = Field(default=150, strict=True, ge=1, le=255)
    closing_size: int = Field(default=3, strict=True, ge=1, le=15)
    min_area: int = Field(default=50, strict=True, ge=1, le=1_000_000)
    opacity: float = Field(default=.5, strict=True, ge=0, le=1)

    @model_validator(mode='after')
    def valid(self):
        if self.adaptive_block % 2 == 0 or self.closing_size % 2 == 0:
            raise ValueError('Neighborhood sizes must be odd.')
        if self.canny_low >= self.canny_high:
            raise ValueError('Canny lower threshold must be less than upper threshold.')
        return self


class View(BaseModel):
    title: str
    description: str
    frame: Frame


class LegendItem(BaseModel):
    id: int
    name: str
    color: str
    pixels: int


class Result(BaseModel):
    parameters: Settings
    views: list[View]
    labels_png: str | None = None
    legend: list[LegendItem] = []
    measurements: dict[str, int | float]
    notes: list[str]
    provenance: dict[str, str | int | float]
