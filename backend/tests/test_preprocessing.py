from app.services.preprocessing import normalize_text, preprocess_text, preprocess_tokens, tokenize


def test_normalize_text_and_tokenize_are_deterministic():
    text = "  SNMP   dan OLT\r\nmenggunakan API. https://example.com admin@example.com  "

    assert normalize_text(text) == "snmp dan olt menggunakan api"
    assert tokenize(text) == ["snmp", "dan", "olt", "menggunakan", "api"]
    assert preprocess_text(text) == preprocess_text(text)


def test_preprocess_removes_stopwords_stems_indonesian_and_preserves_technical_terms():
    tokens = preprocess_tokens(
        "SNMP dan OLT berjalan menggunakan MikroTik RouterOS API untuk monitoring jaringan."
    )

    assert "dan" not in tokens
    assert "untuk" not in tokens
    assert "jalan" in tokens
    assert "snmp" in tokens
    assert "olt" in tokens
    assert "mikrotik" in tokens
    assert "routeros" in tokens
    assert "api" in tokens
