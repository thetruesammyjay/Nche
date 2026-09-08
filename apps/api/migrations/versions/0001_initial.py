"""Create event and risk evaluation tables.

Revision ID: 0001_initial
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "risk_evaluations",
        sa.Column("evaluation_id", sa.String(length=80), primary_key=True),
        sa.Column("customer_ref", sa.String(length=160), nullable=False),
        sa.Column("institution_ref", sa.String(length=160), nullable=True),
        sa.Column("decision", sa.String(length=20), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
    )
    op.create_index("ix_risk_evaluations_customer_ref", "risk_evaluations", ["customer_ref"])
    op.create_index("ix_risk_evaluations_institution_ref", "risk_evaluations", ["institution_ref"])
    op.create_index("ix_risk_evaluations_decision", "risk_evaluations", ["decision"])
    op.create_index("ix_risk_evaluations_created_at", "risk_evaluations", ["created_at"])
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("event_id", sa.String(length=160), nullable=False),
        sa.Column("customer_ref", sa.String(length=160), nullable=False),
        sa.Column("event_name", sa.String(length=80), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.UniqueConstraint("event_id", name="uq_events_event_id"),
    )
    op.create_index("ix_events_event_id", "events", ["event_id"])
    op.create_index("ix_events_customer_ref", "events", ["customer_ref"])
    op.create_index("ix_events_event_name", "events", ["event_name"])
    op.create_index("ix_events_occurred_at", "events", ["occurred_at"])


def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("risk_evaluations")