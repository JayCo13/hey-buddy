from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import AnyHttpUrl, validator


class Settings(BaseSettings):
    # App settings
    PROJECT_NAME: str = "Hey Buddy API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: str = "mysql+pymysql://approot:Hientai12345678990@localhost/hey_buddy_db"
    
    # Security settings
    SECRET_KEY: str = "jdan11102004"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
