"""Persist institution-specific decision thresholds.

Revision ID: 0006_add_institution_policies
Revises: 0005_add_audit_log
"""

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision = "0006_add_institution_policies"
down_revision = "0005_add_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "institution_policies",
        sa.Column("institution_ref", sa.String(length=80), nullable=False),
        sa.Column("challenge_from", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("review_from", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("block_from", sa.Integer(), nullable=False, server_default="80"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_by", sa.String(length=320), nullable=True),
        sa.PrimaryKeyConstraint("institution_ref"),
    )
    policies = sa.table(
        "institution_policies",
        sa.column("institution_ref", sa.String),
        sa.column("challenge_from", sa.Integer),
        sa.column("review_from", sa.Integer),
        sa.column("block_from", sa.Integer),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    institutions = op.get_bind().execute(sa.text("SELECT institution_ref FROM institutions")).fetchall()
    op.bulk_insert(
        policies,
        [
            {
                "institution_ref": row[0],
                "challenge_from": 30,
                "review_from": 60,
                "block_from": 80,
                "updated_at": datetime.now(UTC),
            }
            for row in institutions
        ],
    )


def downgrade() -> None:
    op.drop_table("institution_policies")
