from sqlmodel import Session, select, create_engine
from app.models import InteractionLog

sqlite_file_name = "agents.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def check_db():
    try:
        with Session(engine) as session:
            logs = session.exec(select(InteractionLog)).all()
            print(f"Total logs in DB: {len(logs)}")
            for log in logs:
                print(f"Log: {log}")
    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    check_db()
