from app.services.snippet import build_snippet


def test_snippet_uses_raw_text_surface_and_escapes_html():
    raw_text = (
        "Pendahuluan singkat. <script>alert(1)</script> Parameter redaman optik ONU "
        "dapat diperoleh melalui perangkat OLT menggunakan protokol SNMP."
    )

    result = build_snippet(raw_text, ["redam", "onu", "snmp"], max_length=120)

    assert "Parameter redaman optik ONU" in result.snippet
    assert "<script>" not in result.snippet
    assert "&lt;script&gt;" in result.snippet
    assert result.matched_terms == ["redam", "onu", "snmp"]
