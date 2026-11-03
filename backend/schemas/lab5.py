from pydantic import BaseModel, ConfigDict, Field
from schemas.images import Frame


class Settings(BaseModel):
    model_config = ConfigDict(extra='forbid')
    components: int = Field(default=150, strict=True, ge=12, le=300)


class DatasetInfo(BaseModel):
    ready: bool
    message: str
    samples: int = 0
    height: int = 0
    width: int = 0
    features: int = 0
    names: list[str] = []
    max_components: int = 0


class Eigenface(BaseModel):
    component: int
    variance: float
    frame: Frame


class Prediction(BaseModel):
    index: int
    actual: str
    predicted: str
    frame: Frame


class ReportRow(BaseModel):
    name: str
    kind: str
    precision: float
    recall: float
    f1: float
    support: int


class Result(BaseModel):
    dataset: DatasetInfo
    parameters: Settings
    train_count: int
    test_count: int
    train_indices: list[int]
    test_indices: list[int]
    actual: list[int]
    predicted: list[int]
    accuracy: float
    report: list[ReportRow]
    eigenfaces: list[Eigenface]
    tail_eigenfaces: list[Eigenface]
    cumulative_variance: list[float]
    selected_variance: float
    components_90: int
    predictions: list[Prediction]
    failures: list[Prediction]
    misclassified_count: int
    timings: dict[str, float]
    provenance: dict[str, str | int | float | bool]
