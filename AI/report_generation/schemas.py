from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChildReportInfo(BaseModel):
    childName: str = Field(..., min_length=1)
    childId: str = Field(..., min_length=1)
    parentId: str = Field(..., min_length=1)
    doctorName: str = "Not assigned"
    doctorId: Optional[str] = None
    caseId: Optional[str] = None


class ReportPeriod(BaseModel):
    startDate: datetime
    endDate: datetime


class ModalityCounts(BaseModel):
    text: int = Field(default=0, ge=0)
    image: int = Field(default=0, ge=0)
    voice: int = Field(default=0, ge=0)


class EmotionCounts(BaseModel):
    angry: int = Field(default=0, ge=0)
    disgust: int = Field(default=0, ge=0)
    fear: int = Field(default=0, ge=0)
    happy: int = Field(default=0, ge=0)
    neutral: int = Field(default=0, ge=0)
    sad: int = Field(default=0, ge=0)
    surprise: int = Field(default=0, ge=0)
    unknown: int = Field(default=0, ge=0)


class ReportStatistics(BaseModel):
    modalityCounts: ModalityCounts
    emotionCounts: EmotionCounts
    dominantEmotion: str = "unknown"
    averageConfidence: float = Field(default=0, ge=0, le=100)
    reliableCount: int = Field(default=0, ge=0)
    unreliableCount: int = Field(default=0, ge=0)
    recurringPatterns: List[str] = Field(default_factory=list)


class AnalysisRecord(BaseModel):
    modality: Literal["text", "image", "voice"]
    emotion: Literal[
        "angry",
        "disgust",
        "fear",
        "happy",
        "neutral",
        "sad",
        "surprise",
        "unknown",
    ]
    confidence: float = Field(default=0, ge=0, le=100)
    content: str = ""
    contexts: List[str] = Field(default_factory=list)
    isReliable: bool = False
    createdAt: datetime


class ReportRequest(BaseModel):
    requestedByRole: Literal["parent", "doctor"]
    child: ChildReportInfo
    period: ReportPeriod
    analysisCount: int = Field(..., gt=0)
    statistics: ReportStatistics
    analyses: List[AnalysisRecord] = Field(default_factory=list)


class GeneratedReportResponse(BaseModel):
    summary: str = Field(..., min_length=1)
    report: str = Field(..., min_length=1)
    recommendations: List[str] = Field(default_factory=list)
    overallStatus: Literal[
        "stable",
        "improving",
        "needs_attention",
        "insufficient_data",
    ]