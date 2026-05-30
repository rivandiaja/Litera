from pydantic import BaseModel, Field


class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


def build_pagination(page: int, page_size: int, total: int) -> PaginationMeta:
    total_pages = (total + page_size - 1) // page_size if total else 0
    return PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages)
