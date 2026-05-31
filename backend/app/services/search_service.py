from __future__ import annotations

from collections import Counter, defaultdict
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import String, cast, delete, distinct, func, or_, select, tuple_
from sqlalchemy.orm import Session, joinedload

from app.db.models import (
    Document,
    DocumentPage,
    IndexPosting,
    IndexStatus,
    IndexTerm,
    ProjectVisibility,
    ResearchField,
    ResearchProject,
    SearchHistory,
    User,
    UserRole,
)
from app.schemas.search import (
    CatalogFieldItem,
    CatalogProjectItem,
    CatalogResponse,
    SearchFieldSummary,
    SearchFilters,
    SearchHistoryItem,
    SearchHistoryResponse,
    SearchOwnerSummary,
    SearchPagination,
    SearchProjectSummary,
    SearchResponse,
    SearchResultItem,
)
from app.services.preprocessing import preprocess_tokens
from app.services.project_service import get_project_for_read
from app.services.ranking import page_scores, rank_documents
from app.services.snippet import build_snippet

SearchSort = Literal["relevance", "newest", "title_asc", "title_desc"]


def _pagination(page: int, page_size: int, total_items: int) -> SearchPagination:
    total_pages = (total_items + page_size - 1) // page_size if total_items else 0
    return SearchPagination(page=page, page_size=page_size, total_items=total_items, total_pages=total_pages)


def _unique_in_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        unique.append(value)
    return unique


def _prepare_query(query: str) -> tuple[str, list[str], list[str]]:
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Query must contain at least 2 characters")
    processed_terms = preprocess_tokens(normalized_query)
    if not processed_terms:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Query does not contain searchable terms after preprocessing",
        )
    return normalized_query, processed_terms, _unique_in_order(processed_terms)


def _validate_filters(
    db: Session,
    current_user: User,
    research_field_id: int | None,
    research_project_id: int | None,
    owner_id: int | None,
) -> None:
    if research_field_id is not None and db.get(ResearchField, research_field_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research field not found")
    if research_project_id is not None:
        get_project_for_read(db, research_project_id, current_user)
    if owner_id is not None and db.get(User, owner_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")


def _scope_conditions(
    current_user: User,
    research_field_id: int | None = None,
    research_project_id: int | None = None,
    owner_id: int | None = None,
) -> list:
    conditions = [Document.index_status == IndexStatus.INDEXED]
    if current_user.role != UserRole.ADMIN:
        conditions.append(
            or_(
                ResearchProject.visibility == ProjectVisibility.PUBLIC,
                ResearchProject.user_id == current_user.id,
            )
        )
    if research_field_id is not None:
        conditions.append(ResearchProject.research_field_id == research_field_id)
    if research_project_id is not None:
        conditions.append(Document.research_project_id == research_project_id)
    if owner_id is not None:
        conditions.append(ResearchProject.user_id == owner_id)
    return conditions


def _scoped_document_ids_statement(current_user: User, filters: SearchFilters):
    return (
        select(Document.id)
        .join(ResearchProject, Document.research_project_id == ResearchProject.id)
        .where(
            *_scope_conditions(
                current_user=current_user,
                research_field_id=filters.research_field_id,
                research_project_id=filters.research_project_id,
                owner_id=filters.owner_id,
            )
        )
    )


def _count_scoped_documents(db: Session, current_user: User, filters: SearchFilters) -> int:
    scoped_documents = _scoped_document_ids_statement(current_user, filters).subquery()
    return db.scalar(select(func.count()).select_from(scoped_documents)) or 0


def _save_history(db: Session, current_user: User, query: str, filters: SearchFilters, result_count: int) -> None:
    history = SearchHistory(
        user_id=current_user.id,
        query=query,
        research_field_id=filters.research_field_id,
        research_project_id=filters.research_project_id,
        result_count=result_count,
    )
    db.add(history)
    db.commit()


def search_documents(
    db: Session,
    current_user: User,
    query: str,
    page: int,
    page_size: int,
    sort_by: SearchSort,
    research_field_id: int | None = None,
    research_project_id: int | None = None,
    owner_id: int | None = None,
    save_history: bool = True,
) -> SearchResponse:
    normalized_query, processed_terms, unique_terms = _prepare_query(query)
    _validate_filters(db, current_user, research_field_id, research_project_id, owner_id)
    filters = SearchFilters(
        research_field_id=research_field_id,
        research_project_id=research_project_id,
        owner_id=owner_id,
    )
    total_scoped_documents = _count_scoped_documents(db, current_user, filters)
    scoped_documents_stmt = _scoped_document_ids_statement(current_user, filters)

    terms = db.scalars(select(IndexTerm).where(IndexTerm.term.in_(unique_terms))).all()
    if not terms or total_scoped_documents == 0:
        if save_history:
            _save_history(db, current_user, normalized_query, filters, 0)
        return SearchResponse(
            query=normalized_query,
            processed_terms=unique_terms,
            filters=filters,
            pagination=_pagination(page, page_size, 0),
            results=[],
        )

    term_by_id = {term.id: term.term for term in terms}
    postings = db.execute(
        select(IndexPosting.document_id, IndexPosting.page_number, IndexPosting.term_frequency, IndexPosting.term_id)
        .where(
            IndexPosting.term_id.in_(term_by_id),
            IndexPosting.document_id.in_(scoped_documents_stmt),
        )
    ).all()

    if not postings:
        if save_history:
            _save_history(db, current_user, normalized_query, filters, 0)
        return SearchResponse(
            query=normalized_query,
            processed_terms=unique_terms,
            filters=filters,
            pagination=_pagination(page, page_size, 0),
            results=[],
        )

    document_term_counts: dict[int, Counter[str]] = defaultdict(Counter)
    document_page_term_counts: dict[int, dict[int, Counter[str]]] = defaultdict(lambda: defaultdict(Counter))
    documents_by_term: dict[str, set[int]] = defaultdict(set)

    for document_id, page_number, term_frequency, term_id in postings:
        term = term_by_id[term_id]
        document_term_counts[document_id][term] += term_frequency
        document_page_term_counts[document_id][page_number][term] += term_frequency
        documents_by_term[term].add(document_id)

    document_frequency_by_term = {term: len(document_ids) for term, document_ids in documents_by_term.items()}
    scores = rank_documents(Counter(processed_terms), document_term_counts, total_scoped_documents, document_frequency_by_term)
    scored_document_ids = [document_id for document_id, score in scores.items() if score > 0]

    if not scored_document_ids:
        if save_history:
            _save_history(db, current_user, normalized_query, filters, 0)
        return SearchResponse(
            query=normalized_query,
            processed_terms=unique_terms,
            filters=filters,
            pagination=_pagination(page, page_size, 0),
            results=[],
        )

    documents = db.scalars(
        select(Document)
        .options(
            joinedload(Document.research_project).joinedload(ResearchProject.owner),
            joinedload(Document.research_project).joinedload(ResearchProject.research_field),
        )
        .where(Document.id.in_(scored_document_ids))
    ).all()
    documents_by_id = {document.id: document for document in documents}

    def sort_key(document_id: int):
        document = documents_by_id[document_id]
        if sort_by == "newest":
            return (document.created_at, scores[document_id], document.id)
        if sort_by == "title_asc":
            return (document.title.casefold(), -scores[document_id], document.id)
        if sort_by == "title_desc":
            return (document.title.casefold(), scores[document_id], document.id)
        return (scores[document_id], document.created_at, document.id)

    reverse = sort_by in {"relevance", "newest", "title_desc"}
    ordered_ids = sorted(scored_document_ids, key=sort_key, reverse=reverse)
    total_items = len(ordered_ids)
    page_ids = ordered_ids[(page - 1) * page_size : page * page_size]

    page_scores_by_document = {
        document_id: page_scores(Counter(processed_terms), document_page_term_counts[document_id], total_scoped_documents, document_frequency_by_term)
        for document_id in page_ids
    }
    best_page_by_document: dict[int, int | None] = {}
    relevant_pages_by_document: dict[int, list[int]] = {}
    needed_pages: list[tuple[int, int]] = []
    for document_id, scores_by_page in page_scores_by_document.items():
        ordered_pages = [
            page_number
            for page_number, page_score in sorted(scores_by_page.items(), key=lambda item: (-item[1], item[0]))
            if page_score > 0
        ][:5]
        relevant_pages_by_document[document_id] = ordered_pages
        best_page = ordered_pages[0] if ordered_pages else None
        best_page_by_document[document_id] = best_page
        if best_page is not None:
            needed_pages.append((document_id, best_page))

    raw_pages: dict[tuple[int, int], str] = {}
    if needed_pages:
        rows = db.execute(
            select(DocumentPage.document_id, DocumentPage.page_number, DocumentPage.raw_text).where(
                tuple_(DocumentPage.document_id, DocumentPage.page_number).in_(needed_pages)
            )
        ).all()
        raw_pages = {(document_id, page_number): raw_text for document_id, page_number, raw_text in rows}

    results: list[SearchResultItem] = []
    for document_id in page_ids:
        document = documents_by_id[document_id]
        project = document.research_project
        best_page = best_page_by_document[document_id]
        raw_text = raw_pages.get((document_id, best_page), "") if best_page is not None else ""
        matched_terms = [term for term in unique_terms if document_term_counts[document_id].get(term, 0) > 0]
        snippet = build_snippet(raw_text, matched_terms)
        results.append(
            SearchResultItem(
                document_id=document.id,
                title=document.title,
                original_filename=document.original_filename,
                score=round(scores[document.id], 6),
                relevance_percent=round(max(0.0, min(scores[document.id] * 100, 100.0)), 2),
                total_pages=document.total_pages,
                relevant_pages=relevant_pages_by_document[document.id],
                best_page=best_page,
                snippet=snippet.snippet,
                matched_terms=snippet.matched_terms or matched_terms,
                project=SearchProjectSummary(id=project.id, title=project.title),
                field=SearchFieldSummary(id=project.research_field.id, name=project.research_field.name),
                owner=SearchOwnerSummary(id=project.owner.id, name=project.owner.name),
                created_at=document.created_at,
            )
        )

    if save_history:
        _save_history(db, current_user, normalized_query, filters, total_items)
    return SearchResponse(
        query=normalized_query,
        processed_terms=unique_terms,
        filters=filters,
        pagination=_pagination(page, page_size, total_items),
        results=results,
    )


def search_catalog(db: Session, current_user: User, query: str, limit: int) -> CatalogResponse:
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Query must contain at least 2 characters")
    pattern = f"%{normalized_query}%"

    field_conditions = [
        or_(ResearchField.name.ilike(pattern), ResearchField.description.ilike(pattern))
    ]
    if current_user.role != UserRole.ADMIN:
        field_conditions.append(ResearchField.is_active.is_(True))

    fields = db.scalars(
        select(ResearchField).where(*field_conditions).order_by(ResearchField.name.asc()).limit(limit)
    ).all()

    project_conditions = [
        or_(
            ResearchProject.title.ilike(pattern),
            ResearchProject.description.ilike(pattern),
            cast(ResearchProject.keywords, String).ilike(pattern),
        )
    ]
    if current_user.role != UserRole.ADMIN:
        project_conditions.append(
            or_(
                ResearchProject.visibility == ProjectVisibility.PUBLIC,
                ResearchProject.user_id == current_user.id,
            )
        )

    projects = db.scalars(
        select(ResearchProject)
        .options(joinedload(ResearchProject.owner), joinedload(ResearchProject.research_field))
        .where(*project_conditions)
        .order_by(ResearchProject.created_at.desc(), ResearchProject.id.desc())
        .limit(limit)
    ).all()

    return CatalogResponse(
        query=normalized_query,
        fields=[
            CatalogFieldItem(
                id=field.id,
                name=field.name,
                slug=field.slug,
                description=field.description,
                is_active=field.is_active,
            )
            for field in fields
        ],
        projects=[
            CatalogProjectItem(
                id=project.id,
                title=project.title,
                description=project.description,
                keywords=project.keywords,
                visibility=project.visibility.value,
                owner=SearchOwnerSummary(id=project.owner.id, name=project.owner.name),
                field=SearchFieldSummary(id=project.research_field.id, name=project.research_field.name),
            )
            for project in projects
        ],
    )


def list_history(db: Session, current_user: User, page: int, page_size: int) -> SearchHistoryResponse:
    total = db.scalar(select(func.count(SearchHistory.id)).where(SearchHistory.user_id == current_user.id)) or 0
    histories = db.scalars(
        select(SearchHistory)
        .where(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return SearchHistoryResponse(
        items=[
            SearchHistoryItem(
                id=history.id,
                query=history.query,
                filters=SearchFilters(
                    research_field_id=history.research_field_id,
                    research_project_id=history.research_project_id,
                    owner_id=None,
                ),
                result_count=history.result_count,
                created_at=history.created_at,
            )
            for history in histories
        ],
        pagination=_pagination(page, page_size, total),
    )


def clear_history(db: Session, current_user: User) -> None:
    db.execute(delete(SearchHistory).where(SearchHistory.user_id == current_user.id))
    db.commit()
