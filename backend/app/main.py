from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, dashboard, documents, fields, health, projects, search
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_frontend_origins,
        allow_origin_regex=settings.frontend_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix=settings.api_v1_prefix)
    app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth")
    app.include_router(fields.router, prefix=f"{settings.api_v1_prefix}/fields")
    app.include_router(projects.router, prefix=f"{settings.api_v1_prefix}/projects")
    app.include_router(documents.router, prefix=settings.api_v1_prefix)
    app.include_router(search.router, prefix=settings.api_v1_prefix)
    app.include_router(dashboard.router, prefix=settings.api_v1_prefix)
    app.include_router(admin.router, prefix=f"{settings.api_v1_prefix}/admin")

    return app


app = create_app()
