from __future__ import annotations

from functools import lru_cache
import re
import unicodedata

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

TECHNICAL_TERMS = {
    "snmp",
    "olt",
    "onu",
    "pppoe",
    "ftth",
    "mikrotik",
    "routeros",
    "api",
    "qos",
    "nms",
    "oid",
    "rest",
    "grafana",
    "latency",
    "bandwidth",
    "throughput",
    "packetloss",
}

_stemmer = StemmerFactory().create_stemmer()
_stopwords = set(StopWordRemoverFactory().get_stop_words())
_url_re = re.compile(r"https?://\S+|www\.\S+")
_email_re = re.compile(r"\b[\w.+-]+@[\w.-]+\.\w+\b")
_token_re = re.compile(r"[a-z0-9]+")
_version_re = re.compile(r"v?\d+(?:\.\d+)*")


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    normalized = normalized.lower()
    normalized = _url_re.sub(" ", normalized)
    normalized = _email_re.sub(" ", normalized)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def tokenize(text: str) -> list[str]:
    return _token_re.findall(normalize_text(text))


def _is_useful_token(token: str) -> bool:
    if token in TECHNICAL_TERMS:
        return True
    if token in _stopwords:
        return False
    if len(token) < 3:
        return False
    if token.isdigit() or _version_re.fullmatch(token):
        return False
    return any(character.isalpha() for character in token)


@lru_cache(maxsize=8192)
def _stem_token(token: str) -> str:
    if token in TECHNICAL_TERMS:
        return token
    stemmed = _stemmer.stem(token)
    return stemmed or token


def preprocess_tokens(text: str) -> list[str]:
    processed: list[str] = []
    for token in tokenize(text):
        if not _is_useful_token(token):
            continue
        stemmed = _stem_token(token)
        if stemmed in TECHNICAL_TERMS or _is_useful_token(stemmed):
            processed.append(stemmed)
    return processed


def preprocess_text(text: str) -> str:
    return " ".join(preprocess_tokens(text))
