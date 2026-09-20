from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


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
