from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class AnalystRole(StrEnum):
    ANALYST = "Analyst"
    ADMIN = "Admin"


class AnalystIdentity(BaseModel):
    email: str
    name: str
    role: AnalystRole


class AnalystLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)


class AnalystCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=2, max_length=120)
    role: AnalystRole = AnalystRole.ANALYST
    password: str = Field(min_length=8, max_length=256)


class Analyst(AnalystIdentity):
    status: str = "active"
    created_at: datetime
