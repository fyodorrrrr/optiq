from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from schemas.images import Frame


class Settings(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    model: Literal['pretrained', 'custom'] = 'pretrained'
    confidence: float = Field(default=.25, strict=True, gt=0, le=1)


class ModelInfo(BaseModel):
    id: Literal['pretrained', 'custom']
    title: str
    available: bool
    message: str


class Status(BaseModel):
    models: list[ModelInfo]
    bottle_sample_available: bool = False
    bottle_sample_split: Literal['train', 'val', 'test'] | None = None
    training_log_available: bool = False
    sample_available: bool
    dataset: dict
    training: dict


class Detection(BaseModel):
    class_id: int
    label: str
    confidence: float
    xyxy: list[float]


class Result(BaseModel):
    output: Frame
    detections: list[Detection]
    parameters: Settings
    elapsed_ms: float
    stages_ms: dict[str, float]
    provenance: dict[str, str | int | float]


class SplitCounts(BaseModel):
    images: int = Field(ge=0)
    objects: int = Field(ge=0)
    backgrounds: int = Field(ge=0)


class DatasetArtifact(BaseModel):
    ready: bool = False
    message: str = ''
    names: list[str] = []
    splits: dict[str, SplitCounts] = {}
    sha256: str | None = None
    reviewed_images: int = Field(default=0, ge=0)
    image_splits: dict[str, Literal['train', 'val', 'test']] = Field(default_factory=dict, exclude=True)


class EvaluationMetrics(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    precision: float = Field(ge=0, le=1)
    recall: float = Field(ge=0, le=1)
    map50: float = Field(ge=0, le=1)
    map50_95: float = Field(ge=0, le=1)


class TrainingArtifact(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    status: Literal['pending', 'running', 'failed', 'completed', 'invalid']
    message: str
    baseline: bool = False
    epochs_completed: int | None = Field(default=None, ge=1)
    evaluation_split: Literal['val', 'test'] | None = None
    metrics: EvaluationMetrics | None = None
    parameters: dict[str, str | int | float | bool] = {}
    history: list[dict[str, float]] = Field(default_factory=list, max_length=1000)
    weight_sha256: str | None = None
    dataset_sha256: str | None = None
    started_utc: str | None = None
    completed_utc: str | None = None
    ultralytics: str | None = None
    torch: str | None = None
    run_directory: str | None = None
    initial_weight_sha256: str | None = None
