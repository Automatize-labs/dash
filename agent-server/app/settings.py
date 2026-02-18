from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str

    # Service
    SERVICE_NAME: str = "AgentServer"
    LOG_LEVEL: str = "INFO"

    # Application Paths
    PROMPTS_DIR: str = "app/prompts"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
