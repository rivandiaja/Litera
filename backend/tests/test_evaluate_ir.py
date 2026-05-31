import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.cli.evaluate_ir import evaluate_judgments, format_evaluation, precision_at_k, recall_at_k
from app.db.models import SearchHistory, UserRole
from tests.helpers import create_field, create_indexed_document, create_project, create_user


def test_precision_at_k_uses_fixed_k_denominator():
    assert precision_at_k(["a.pdf", "b.pdf"], ["a.pdf", "c.pdf"], 5) == 0.2


def test_recall_at_k_returns_none_without_ground_truth():
    assert recall_at_k(["a.pdf"], [], 5) is None


def test_recall_at_k_uses_relevant_document_count():
    assert recall_at_k(["a.pdf", "b.pdf"], ["a.pdf", "c.pdf"], 2) == 0.5


def test_evaluate_judgments_outputs_metrics_without_search_history(tmp_path: Path, db_session: Session):
    admin = create_user(
        db_session,
        email="admin@example.test",
        student_number="ADM-IR",
        role=UserRole.ADMIN,
        name="Admin IR",
    )
    field = create_field(db_session)
    project = create_project(db_session, owner=admin, field=field)
    create_indexed_document(
        db_session,
        project=project,
        title="Monitoring OLT",
        pages=["SNMP OLT ONU monitoring jaringan FTTH"],
        original_filename="monitoring-olt.pdf",
    )
    create_indexed_document(
        db_session,
        project=project,
        title="MikroTik PPPoE",
        pages=["MikroTik API PPPoE pelanggan router"],
        original_filename="mikrotik-pppoe.pdf",
    )
    judgments_path = tmp_path / "judgments.json"
    judgments_path.write_text(
        json.dumps(
            {
                "queries": [
                    {
                        "query": "snmp olt onu",
                        "relevant_documents": ["monitoring-olt.pdf"],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )

    summary = evaluate_judgments(judgments_path, db=db_session, k=2)
    report = format_evaluation(summary)

    assert summary.queries[0].retrieved_documents == ["monitoring-olt.pdf"]
    assert summary.queries[0].precision_at_k == 0.5
    assert summary.queries[0].recall_at_k == 1.0
    assert "Precision@2: 0.50" in report
    assert "Recall@2: 1.00" in report
    assert db_session.scalar(select(func.count(SearchHistory.id))) == 0
