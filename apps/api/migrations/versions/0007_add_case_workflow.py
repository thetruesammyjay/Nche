"""Persist analyst case workflow state on evaluations.

Revision ID: 0007_add_case_workflow
Revises: 0006_add_institution_policies
"""

import sqlalchemy as sa
from alembic import op

revision = "0007_add_case_workflow"
down_revision = "0006_add_institution_policies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("risk_evaluations", sa.Column("case_status", sa.String(length=20), nullable=False, server_default="NEW"))
    op.add_column("risk_evaluations", sa.Column("assigned_to", sa.String(length=320), nullable=True))
    op.add_column("risk_evaluations", sa.Column("case_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(sa.text("UPDATE risk_evaluations SET case_updated_at = created_at WHERE case_updated_at IS NULL"))
    op.alter_column("risk_evaluations", "case_updated_at", nullable=False)
    op.create_index("ix_risk_evaluations_case_status", "risk_evaluations", ["case_status"])
    op.create_index("ix_risk_evaluations_assigned_to", "risk_evaluations", ["assigned_to"])


def downgrade() -> None:
    op.drop_index("ix_risk_evaluations_assigned_to", table_name="risk_evaluations")
    op.drop_index("ix_risk_evaluations_case_status", table_name="risk_evaluations")
    op.drop_column("risk_evaluations", "case_updated_at")
    op.drop_column("risk_evaluations", "assigned_to")
    op.drop_column("risk_evaluations", "case_status")
