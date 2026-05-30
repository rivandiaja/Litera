import os
import shutil
import sys
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DB = BACKEND_DIR / "test_litera.db"
TEST_UPLOAD_DIR = BACKEND_DIR / "test_uploads"

sys.path.insert(0, str(BACKEND_DIR))

os.environ["APP_NAME"] = "Litera API"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
os.environ["FRONTEND_ORIGIN"] = "http://127.0.0.1:5173"
os.environ["UPLOAD_DIR"] = str(TEST_UPLOAD_DIR)
os.environ["MAX_PDF_SIZE_MB"] = "1"

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


def _alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
    return config


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    if TEST_DB.exists():
        TEST_DB.unlink()
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    command.upgrade(_alembic_config(), "head")
    yield
    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)


@pytest.fixture(autouse=True)
def clean_database(migrated_database):
    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield
    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
    if TEST_UPLOAD_DIR.exists():
        shutil.rmtree(TEST_UPLOAD_DIR)
    TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
