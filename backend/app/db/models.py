from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STUDENT = "student"


class ProjectVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class IndexStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


def enum_column(enum_type: type[enum.Enum], name: str) -> Enum:
    return Enum(
        enum_type,
        name=name,
        native_enum=False,
        validate_strings=True,
        values_callable=lambda values: [item.value for item in values],
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("student_number", name="uq_users_student_number"),
        Index("ix_users_email", "email"),
        Index("ix_users_student_number", "student_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    student_number: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    study_program: Mapped[str] = mapped_column(String(120), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[UserRole] = mapped_column(enum_column(UserRole, "user_role"), nullable=False, default=UserRole.STUDENT)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    projects: Mapped[list[ResearchProject]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    search_histories: Mapped[list[SearchHistory]] = relationship(back_populates="user", cascade="all, delete-orphan")


class ResearchField(TimestampMixin, Base):
    __tablename__ = "research_fields"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_research_fields_slug"),
        Index("ix_research_fields_slug", "slug"),
        Index("ix_research_fields_is_active", "is_active"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String(80), nullable=False, default="BookOpen")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    projects: Mapped[list[ResearchProject]] = relationship(back_populates="research_field")
    search_histories: Mapped[list[SearchHistory]] = relationship(back_populates="research_field")


class ResearchProject(TimestampMixin, Base):
    __tablename__ = "research_projects"
    __table_args__ = (
        Index("ix_research_projects_user_id", "user_id"),
        Index("ix_research_projects_research_field_id", "research_field_id"),
        Index("ix_research_projects_visibility", "visibility"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    research_field_id: Mapped[int] = mapped_column(ForeignKey("research_fields.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    visibility: Mapped[ProjectVisibility] = mapped_column(
        enum_column(ProjectVisibility, "project_visibility"),
        nullable=False,
        default=ProjectVisibility.PUBLIC,
    )

    owner: Mapped[User] = relationship(back_populates="projects")
    research_field: Mapped[ResearchField] = relationship(back_populates="projects")
    documents: Mapped[list[Document]] = relationship(back_populates="research_project", cascade="all, delete-orphan")
    search_histories: Mapped[list[SearchHistory]] = relationship(back_populates="research_project")


class Document(TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("total_pages >= 0", name="ck_documents_total_pages_non_negative"),
        CheckConstraint("file_size >= 0", name="ck_documents_file_size_non_negative"),
        Index("ix_documents_research_project_id", "research_project_id"),
        Index("ix_documents_index_status", "index_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    research_project_id: Mapped[int] = mapped_column(ForeignKey("research_projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    index_status: Mapped[IndexStatus] = mapped_column(
        enum_column(IndexStatus, "index_status"),
        nullable=False,
        default=IndexStatus.PENDING,
    )
    index_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    indexed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    research_project: Mapped[ResearchProject] = relationship(back_populates="documents")
    pages: Mapped[list[DocumentPage]] = relationship(back_populates="document", cascade="all, delete-orphan")
    stats: Mapped[Optional[DocumentStats]] = relationship(back_populates="document", cascade="all, delete-orphan", uselist=False)
    postings: Mapped[list[IndexPosting]] = relationship(back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (
        UniqueConstraint("document_id", "page_number", name="uq_document_pages_document_page"),
        Index("ix_document_pages_document_id", "document_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    clean_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    document: Mapped[Document] = relationship(back_populates="pages")


class DocumentStats(TimestampMixin, Base):
    __tablename__ = "document_stats"
    __table_args__ = (
        UniqueConstraint("document_id", name="uq_document_stats_document_id"),
        CheckConstraint("total_terms >= 0", name="ck_document_stats_total_terms_non_negative"),
        CheckConstraint("indexed_page_count >= 0", name="ck_document_stats_indexed_page_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    total_terms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    indexed_page_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    document: Mapped[Document] = relationship(back_populates="stats")


class IndexTerm(TimestampMixin, Base):
    __tablename__ = "index_terms"
    __table_args__ = (
        UniqueConstraint("term", name="uq_index_terms_term"),
        Index("ix_index_terms_term", "term"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    term: Mapped[str] = mapped_column(String(120), nullable=False)
    document_frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    postings: Mapped[list[IndexPosting]] = relationship(back_populates="term", cascade="all, delete-orphan")


class IndexPosting(Base):
    __tablename__ = "index_postings"
    __table_args__ = (
        UniqueConstraint("term_id", "document_id", "page_number", name="uq_index_postings_term_doc_page"),
        CheckConstraint("term_frequency >= 0", name="ck_index_postings_term_frequency_non_negative"),
        Index("ix_index_postings_term_id", "term_id"),
        Index("ix_index_postings_document_id", "document_id"),
        Index("ix_index_postings_term_document", "term_id", "document_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("index_terms.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    term_frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    term: Mapped[IndexTerm] = relationship(back_populates="postings")
    document: Mapped[Document] = relationship(back_populates="postings")


class SearchHistory(Base):
    __tablename__ = "search_histories"
    __table_args__ = (
        Index("ix_search_histories_user_id", "user_id"),
        Index("ix_search_histories_research_field_id", "research_field_id"),
        Index("ix_search_histories_research_project_id", "research_project_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    research_field_id: Mapped[Optional[int]] = mapped_column(ForeignKey("research_fields.id", ondelete="SET NULL"), nullable=True)
    research_project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("research_projects.id", ondelete="SET NULL"), nullable=True)
    result_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped[User] = relationship(back_populates="search_histories")
    research_field: Mapped[Optional[ResearchField]] = relationship(back_populates="search_histories")
    research_project: Mapped[Optional[ResearchProject]] = relationship(back_populates="search_histories")
