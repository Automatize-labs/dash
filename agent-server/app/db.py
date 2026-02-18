from sqlmodel import SQLModel, create_engine, Session
from app.settings import get_settings

settings = get_settings()

# Use SQLite for now
sqlite_file_name = "agents.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
