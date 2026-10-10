"""Persist institution workspaces.

Revision ID: 0003_add_institutions
Revises: 0002_add_idempotency_key
"""

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision = "0003_add_institutions"
down_revision = "0002_add_idempotency_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "institutions",
        sa.Column("institution_ref", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("institution_type", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("institution_ref"),
    )

    institutions = sa.table(
        "institutions",
        sa.column("institution_ref", sa.String),
        sa.column("name", sa.String),
        sa.column("institution_type", sa.String),
        sa.column("status", sa.String),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        institutions,
        [
            {"institution_ref": "apex_mfb", "name": "Apex Microfinance Bank", "institution_type": "microfinance", "status": "active", "created_at": datetime(2026, 1, 1, tzinfo=UTC)},
            {"institution_ref": "kuda", "name": "Kuda Microfinance Bank", "institution_type": "microfinance", "status": "active", "created_at": datetime(2026, 1, 1, tzinfo=UTC)},
            {"institution_ref": "opay", "name": "OPay", "institution_type": "wallet", "status": "active", "created_at": datetime(2026, 1, 1, tzinfo=UTC)},
            {"institution_ref": "palmpay", "name": "PalmPay", "institution_type": "wallet", "status": "active", "created_at": datetime(2026, 1, 1, tzinfo=UTC)},
        ],
    )


def downgrade() -> None:
    op.drop_table("institutions")
