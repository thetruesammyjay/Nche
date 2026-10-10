from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class InstitutionType(StrEnum):
    BANK = "bank"
    FINTECH = "fintech"
    MICROFINANCE = "microfinance"
    WALLET = "wallet"
    COOPERATIVE = "cooperative"


class Institution(BaseModel):
    institution_ref: str
    name: str
    institution_type: InstitutionType
    status: str = "active"
    created_at: datetime


class InstitutionCreate(BaseModel):
    institution_ref: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9][a-z0-9_-]*$")
    name: str = Field(min_length=2, max_length=160)
    institution_type: InstitutionType


class InstitutionPolicyUpdate(BaseModel):
    challenge_from: int = Field(default=30, ge=0, le=100)
    review_from: int = Field(default=60, ge=0, le=100)
    block_from: int = Field(default=80, ge=0, le=100)

    @model_validator(mode="after")
    def validate_order(self) -> "InstitutionPolicyUpdate":
        if not self.challenge_from < self.review_from < self.block_from:
            raise ValueError("policy thresholds must increase from challenge to review to block")
        return self


class InstitutionPolicy(InstitutionPolicyUpdate):
    institution_ref: str
    updated_at: datetime
    updated_by: str | None = None
