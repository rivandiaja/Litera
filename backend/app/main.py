from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, fields, health, projects
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix=settings.api_v1_prefix)
    app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth")
    app.include_router(fields.router, prefix=f"{settings.api_v1_prefix}/fields")
    app.include_router(projects.router, prefix=f"{settings.api_v1_prefix}/projects")

    return app


app = create_app()
