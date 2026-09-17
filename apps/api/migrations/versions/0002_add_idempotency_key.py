"""Add idempotency keys for pre-transfer evaluations.

Revision ID: 0002_add_idempotency_key
Revises: 0001_initial
"""
import sqlalchemy as sa
from alembic import op

revision = "0002_add_idempotency_key"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("risk_evaluations", sa.Column("idempotency_key", sa.String(length=160), nullable=True))
    op.create_index(
        "ix_risk_evaluations_idempotency_key",
        "risk_evaluations",
        ["idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_risk_evaluations_idempotency_key", table_name="risk_evaluations")
    op.drop_column("risk_evaluations", "idempotency_key")
