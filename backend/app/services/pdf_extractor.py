from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re

import fitz


class PdfExtractionError(Exception):
    pass


class PdfNoTextError(PdfExtractionError):
    pass


class PdfReadError(PdfExtractionError):
    pass


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    raw_text: str


@dataclass(frozen=True)
class ExtractedPdf:
    total_pages: int
    pages: list[ExtractedPage]
    total_characters: int


def normalize_extracted_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t\f\v]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def extract_pdf_text(path: Path) -> ExtractedPdf:
    try:
        with fitz.open(path) as pdf:
            pages = [
                ExtractedPage(
                    page_number=index + 1,
                    raw_text=normalize_extracted_text(page.get_text("text", sort=True)),
                )
                for index, page in enumerate(pdf)
            ]
    except (fitz.FileDataError, RuntimeError, ValueError, OSError) as exc:
        raise PdfReadError("File PDF tidak dapat dibuka atau rusak.") from exc

    total_characters = sum(len(page.raw_text) for page in pages)
    if total_characters == 0 or all(not page.raw_text.strip() for page in pages):
        raise PdfNoTextError("PDF tidak memiliki teks yang dapat diekstrak. OCR belum didukung pada MVP.")

    return ExtractedPdf(total_pages=len(pages), pages=pages, total_characters=total_characters)
