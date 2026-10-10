"""Persist an append-only audit trail for sensitive operations.

Revision ID: 0005_add_audit_log
Revises: 0004_add_analyst_users
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005_add_audit_log"
down_revision = "0004_add_analyst_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("actor_ref", sa.String(length=320), nullable=True),
        sa.Column("institution_ref", sa.String(length=160), nullable=True),
        sa.Column("evaluation_id", sa.String(length=80), nullable=True),
        sa.Column("request_id", sa.String(length=80), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_log_action", "audit_log", ["action"])
    op.create_index("ix_audit_log_actor_ref", "audit_log", ["actor_ref"])
    op.create_index("ix_audit_log_institution_ref", "audit_log", ["institution_ref"])
    op.create_index("ix_audit_log_evaluation_id", "audit_log", ["evaluation_id"])
    op.create_index("ix_audit_log_request_id", "audit_log", ["request_id"])
    op.create_index("ix_audit_log_occurred_at", "audit_log", ["occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_occurred_at", table_name="audit_log")
    op.drop_index("ix_audit_log_request_id", table_name="audit_log")
    op.drop_index("ix_audit_log_evaluation_id", table_name="audit_log")
    op.drop_index("ix_audit_log_institution_ref", table_name="audit_log")
    op.drop_index("ix_audit_log_actor_ref", table_name="audit_log")
    op.drop_index("ix_audit_log_action", table_name="audit_log")
    op.drop_table("audit_log")
