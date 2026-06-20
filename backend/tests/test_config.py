from app.core.config import Settings


def test_settings_normalize_supabase_postgres_url():
    settings = Settings(_env_file=None, DATABASE_URL="postgresql://user:pass@host:6543/postgres")

    assert settings.database_url == "postgresql+psycopg://user:pass@host:6543/postgres"


def test_settings_support_multiple_frontend_origins():
    settings = Settings(
        _env_file=None,
        FRONTEND_ORIGIN="http://127.0.0.1:5173/",
        FRONTEND_ORIGINS="https://litera.vercel.app, https://preview.vercel.app/",
    )

    assert settings.allowed_frontend_origins == [
        "http://127.0.0.1:5173",
        "https://litera.vercel.app",
        "https://preview.vercel.app",
    ]
