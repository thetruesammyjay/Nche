from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EventChannel(StrEnum):
    MOBILE = "mobile"
    WEB = "web"
    USSD = "ussd"
    API = "api"


class EventName(StrEnum):
    LOGIN = "login"
    NEW_DEVICE_LOGIN = "new_device_login"
    PASSWORD_RESET = "password_reset"
    PIN_CHANGE = "pin_change"
    BENEFICIARY_CREATED = "beneficiary_created"
    TRANSFER_INITIATED = "transfer_initiated"


class NcheEvent(BaseModel):
    event_id: str
    customer_ref: str
    event_name: EventName
    channel: EventChannel
    occurred_at: datetime
    device_ref: str | None = None
    beneficiary_ref: str | None = None
    amount: float | None = Field(default=None, ge=0)
    metadata: dict[str, str | int | float | bool] = Field(default_factory=dict)
