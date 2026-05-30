from collections import Counter
from math import isclose, log

from app.services.ranking import cosine_similarity, idf, rank_documents, tf_weight


def test_tf_weight_and_idf_formulas_are_explicit():
    assert tf_weight(0) == 0
    assert isclose(tf_weight(3), 1 + log(3))
    assert isclose(idf(10, 2), log((10 + 1) / (2 + 1)) + 1)


def test_cosine_similarity_handles_zero_norm():
    assert cosine_similarity({}, {"snmp": 1.0}) == 0
    assert cosine_similarity({"snmp": 1.0}, {}) == 0


def test_rank_documents_orders_more_relevant_document_higher():
    scores = rank_documents(
        Counter(["snmp", "snmp", "onu"]),
        {
            1: Counter({"snmp": 4, "onu": 2}),
            2: Counter({"snmp": 1}),
        },
        total_documents=2,
        document_frequency_by_term={"snmp": 2, "onu": 1},
    )

    assert scores[1] > scores[2] > 0
