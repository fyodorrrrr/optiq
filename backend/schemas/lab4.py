from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.images import Frame


class FeatureSettings(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    hessian_threshold: Annotated[float, Field(strict=True, gt=0, le=100000)] = 400.0
    upright: Annotated[bool, Field(strict=True)] = False
    ratio_threshold: Annotated[float, Field(strict=True, gt=0, lt=1)] = 0.75
    max_features: Annotated[int, Field(strict=True, ge=1, le=1000)] = 500
    max_matches: Annotated[int, Field(strict=True, ge=1, le=100)] = 50


class Capability(BaseModel):
    id: Literal["surf", "sift", "orb"]
    title: str
    available: bool
    reason: str | None = None


class Capabilities(BaseModel):
    engine: str
    algorithms: list[Capability]


class SamplePair(BaseModel):
    first: Frame
    second: Frame
    notes: list[str]


class FeatureResult(BaseModel):
    algorithm: Literal["surf", "sift", "orb"]
    status: Literal["ok", "unavailable", "error"]
    message: str | None = None
    keypoints_first: int | None = None
    keypoints_second: int | None = None
    descriptor_dimensions: int | None = None
    descriptor_dtype: str | None = None
    norm: str | None = None
    first_ms: float | None = None
    second_ms: float | None = None
    match_ms: float | None = None
    good_matches: int | None = None
    displayed_matches: int | None = None
    keypoints_first_image: Frame | None = None
    keypoints_second_image: Frame | None = None
    matches_image: Frame | None = None


class FeatureComparison(BaseModel):
    algorithms: list[FeatureResult]
    parameters: FeatureSettings
    engine: str
    notes: list[str]
