from datetime import UTC, datetime

from nche.engine.risk_fusion import evaluate
from nche.schemas.events import EventChannel, EventName, NcheEvent
from nche.schemas.risk import Decision, RiskRequest


def test_takeover_sequence_blocks() -> None:
    now = datetime.now(UTC)
    events = [
        NcheEvent(event_id="1", customer_ref="customer_test", event_name=EventName.NEW_DEVICE_LOGIN, channel=EventChannel.WEB, occurred_at=now),
        NcheEvent(event_id="2", customer_ref="customer_test", event_name=EventName.PASSWORD_RESET, channel=EventChannel.WEB, occurred_at=now),
        NcheEvent(event_id="3", customer_ref="customer_test", event_name=EventName.BENEFICIARY_CREATED, channel=EventChannel.WEB, occurred_at=now),
        NcheEvent(event_id="4", customer_ref="customer_test", event_name=EventName.TRANSFER_INITIATED, channel=EventChannel.WEB, occurred_at=now, amount=650000),
    ]
    result = evaluate(RiskRequest(customer_ref="customer_test", events=events))
    assert result.decision == Decision.BLOCK
    assert result.risk_score == 90
    assert result.primary_reason == "account_takeover_sequence"


def test_transfer_amount_increases_risk_when_customer_median_is_known() -> None:
    now = datetime.now(UTC)

    def evaluate_amount(amount: float):
        event = NcheEvent(
            event_id=f"transfer-{amount}",
            customer_ref="customer_amount_test",
            event_name=EventName.TRANSFER_INITIATED,
            channel=EventChannel.WEB,
            occurred_at=now,
            amount=amount,
            metadata={"customer_median_amount": 35000},
        )
        return evaluate(RiskRequest(customer_ref="customer_amount_test", events=[event]))

    ordinary = evaluate_amount(35000)
    unusual = evaluate_amount(650000)

    assert unusual.risk_score > ordinary.risk_score
