"""Add email verification codes

Revision ID: 3b7c2f4a91d0
Revises: fe56fa70289e
Create Date: 2026-07-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "3b7c2f4a91d0"
down_revision: str | None = "fe56fa70289e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "email_verification_code",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("purpose", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False),
        sa.Column("code_digest", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_email_verification_code_email"),
        "email_verification_code",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_email_verification_code_purpose"),
        "email_verification_code",
        ["purpose"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_email_verification_code_purpose"),
        table_name="email_verification_code",
    )
    op.drop_index(
        op.f("ix_email_verification_code_email"),
        table_name="email_verification_code",
    )
    op.drop_table("email_verification_code")
