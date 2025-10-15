from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.database import engine
from app import models
from app.routers import auth, jobs, applications, profiles, notifications, webhook

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Telegram Job Platform API",
    description="Backend API for Telegram Job Platform Mini App",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(webhook.router, prefix="/api/webhook", tags=["Webhook"])


@app.get("/")
async def root():
    return {"message": "Telegram Job Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
