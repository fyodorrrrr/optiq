from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from schemas.images import Frame


class EdgeSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")
    blur_kernel: Annotated[int, Field(strict=True, ge=1, le=9)] = 3
    sobel_kernel: Annotated[int, Field(strict=True, ge=3, le=7)] = 3
    low_threshold: Annotated[int, Field(strict=True, ge=0, le=2048)] = 100
    high_threshold: Annotated[int, Field(strict=True, ge=1, le=2048)] = 200

    @field_validator("blur_kernel", "sobel_kernel")
    @classmethod
    def odd_kernel(cls, value):
        if value % 2 == 0:
            raise ValueError("Kernel sizes must be odd.")
        return value

    @model_validator(mode="after")
    def ordered_thresholds(self):
        if self.low_threshold >= self.high_threshold:
            raise ValueError("The lower threshold must be smaller than the upper threshold.")
        return self


class EdgeStatistics(BaseModel):
    sobel_max: float
    sobel_x_min: float
    sobel_x_max: float
    sobel_y_min: float
    sobel_y_max: float
    canny_edge_pixels: int
    canny_edge_percent: float


class EdgeResult(BaseModel):
    original: Frame
    blurred: Frame
    sobel: Frame
    sobel_x: Frame
    sobel_y: Frame
    canny: Frame
    parameters: EdgeSettings
    statistics: EdgeStatistics
    engine: str
    display_scaling: str
