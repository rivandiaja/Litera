import pytest

from app.services.pdf_extractor import PdfNoTextError, PdfReadError, extract_pdf_text
from tests.helpers import make_pdf_bytes


def test_extract_pdf_text_reads_pages_starting_from_one(tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(make_pdf_bytes(["SNMP monitoring page one", "OLT page two"]))

    extracted = extract_pdf_text(pdf_path)

    assert extracted.total_pages == 2
    assert extracted.pages[0].page_number == 1
    assert extracted.pages[1].page_number == 2
    assert "SNMP monitoring" in extracted.pages[0].raw_text
    assert extracted.total_characters > 0


def test_extract_pdf_text_rejects_blank_pdf_without_ocr(tmp_path):
    pdf_path = tmp_path / "blank.pdf"
    pdf_path.write_bytes(make_pdf_bytes([""]))

    with pytest.raises(PdfNoTextError):
        extract_pdf_text(pdf_path)


def test_extract_pdf_text_rejects_corrupt_pdf(tmp_path):
    pdf_path = tmp_path / "broken.pdf"
    pdf_path.write_bytes(b"%PDF-this-is-not-a-valid-pdf")

    with pytest.raises(PdfReadError):
        extract_pdf_text(pdf_path)
