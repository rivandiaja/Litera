"""initial schema

Revision ID: 20260530_0001
Revises:
Create Date: 2026-05-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260530_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

user_role = sa.Enum("admin", "student", name="user_role", native_enum=False)
project_visibility = sa.Enum("public", "private", name="project_visibility", native_enum=False)
index_status = sa.Enum("pending", "processing", "indexed", "failed", name="index_status", native_enum=False)


def timestamp_columns() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("student_number", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("study_program", sa.String(length=120), nullable=False),
        sa.Column("class_name", sa.String(length=50), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *timestamp_columns(),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("student_number", name="uq_users_student_number"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_student_number", "users", ["student_number"])

    op.create_table(
        "research_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(length=80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *timestamp_columns(),
        sa.UniqueConstraint("slug", name="uq_research_fields_slug"),
    )
    op.create_index("ix_research_fields_slug", "research_fields", ["slug"])
    op.create_index("ix_research_fields_is_active", "research_fields", ["is_active"])

    op.create_table(
        "research_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("research_field_id", sa.Integer(), sa.ForeignKey("research_fields.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("keywords", sa.JSON(), nullable=False),
        sa.Column("visibility", project_visibility, nullable=False),
        *timestamp_columns(),
    )
    op.create_index("ix_research_projects_user_id", "research_projects", ["user_id"])
    op.create_index("ix_research_projects_research_field_id", "research_projects", ["research_field_id"])
    op.create_index("ix_research_projects_visibility", "research_projects", ["visibility"])

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("research_project_id", sa.Integer(), sa.ForeignKey("research_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("total_pages", sa.Integer(), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("index_status", index_status, nullable=False),
        sa.Column("index_message", sa.Text(), nullable=True),
        sa.Column("indexed_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint("total_pages >= 0", name="ck_documents_total_pages_non_negative"),
        sa.CheckConstraint("file_size >= 0", name="ck_documents_file_size_non_negative"),
    )
    op.create_index("ix_documents_research_project_id", "documents", ["research_project_id"])
    op.create_index("ix_documents_index_status", "documents", ["index_status"])

    op.create_table(
        "document_pages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("clean_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("document_id", "page_number", name="uq_document_pages_document_page"),
    )
    op.create_index("ix_document_pages_document_id", "document_pages", ["document_id"])

    op.create_table(
        "document_stats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_terms", sa.Integer(), nullable=False),
        sa.Column("indexed_page_count", sa.Integer(), nullable=False),
        *timestamp_columns(),
        sa.UniqueConstraint("document_id", name="uq_document_stats_document_id"),
        sa.CheckConstraint("total_terms >= 0", name="ck_document_stats_total_terms_non_negative"),
        sa.CheckConstraint("indexed_page_count >= 0", name="ck_document_stats_indexed_page_count_non_negative"),
    )

    op.create_table(
        "index_terms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("term", sa.String(length=120), nullable=False),
        sa.Column("document_frequency", sa.Integer(), nullable=False),
        *timestamp_columns(),
        sa.UniqueConstraint("term", name="uq_index_terms_term"),
    )
    op.create_index("ix_index_terms_term", "index_terms", ["term"])

    op.create_table(
        "index_postings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("term_id", sa.Integer(), sa.ForeignKey("index_terms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("term_frequency", sa.Integer(), nullable=False),
        sa.UniqueConstraint("term_id", "document_id", "page_number", name="uq_index_postings_term_doc_page"),
        sa.CheckConstraint("term_frequency >= 0", name="ck_index_postings_term_frequency_non_negative"),
    )
    op.create_index("ix_index_postings_term_id", "index_postings", ["term_id"])
    op.create_index("ix_index_postings_document_id", "index_postings", ["document_id"])
    op.create_index("ix_index_postings_term_document", "index_postings", ["term_id", "document_id"])

    op.create_table(
        "search_histories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("query", sa.String(length=255), nullable=False),
        sa.Column("research_field_id", sa.Integer(), sa.ForeignKey("research_fields.id", ondelete="SET NULL"), nullable=True),
        sa.Column("research_project_id", sa.Integer(), sa.ForeignKey("research_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("result_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_search_histories_user_id", "search_histories", ["user_id"])
    op.create_index("ix_search_histories_research_field_id", "search_histories", ["research_field_id"])
    op.create_index("ix_search_histories_research_project_id", "search_histories", ["research_project_id"])


def downgrade() -> None:
    op.drop_index("ix_search_histories_research_project_id", table_name="search_histories")
    op.drop_index("ix_search_histories_research_field_id", table_name="search_histories")
    op.drop_index("ix_search_histories_user_id", table_name="search_histories")
    op.drop_table("search_histories")
    op.drop_index("ix_index_postings_term_document", table_name="index_postings")
    op.drop_index("ix_index_postings_document_id", table_name="index_postings")
    op.drop_index("ix_index_postings_term_id", table_name="index_postings")
    op.drop_table("index_postings")
    op.drop_index("ix_index_terms_term", table_name="index_terms")
    op.drop_table("index_terms")
    op.drop_table("document_stats")
    op.drop_index("ix_document_pages_document_id", table_name="document_pages")
    op.drop_table("document_pages")
    op.drop_index("ix_documents_index_status", table_name="documents")
    op.drop_index("ix_documents_research_project_id", table_name="documents")
    op.drop_table("documents")
    op.drop_index("ix_research_projects_visibility", table_name="research_projects")
    op.drop_index("ix_research_projects_research_field_id", table_name="research_projects")
    op.drop_index("ix_research_projects_user_id", table_name="research_projects")
    op.drop_table("research_projects")
    op.drop_index("ix_research_fields_is_active", table_name="research_fields")
    op.drop_index("ix_research_fields_slug", table_name="research_fields")
    op.drop_table("research_fields")
    op.drop_index("ix_users_student_number", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
