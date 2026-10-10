"""Persist analyst identities for API-backed sign-in.

Revision ID: 0004_add_analyst_users
Revises: 0003_add_institutions
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_add_analyst_users"
down_revision = "0003_add_institutions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analyst_users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="Analyst"),
        sa.Column("password_hash", sa.String(length=300), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("email"),
    )


def downgrade() -> None:
    op.drop_table("analyst_users")
