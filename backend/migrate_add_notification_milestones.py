"""
Migration script to add job_notification_milestones table
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if table already exists (SQLite-specific)
        result = conn.execute(text("""
            SELECT name FROM sqlite_master WHERE type='table' AND name='job_notification_milestones'
        """))
        
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("Creating job_notification_milestones table...")
            conn.execute(text("""
                CREATE TABLE job_notification_milestones (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL,
                    milestone INTEGER NOT NULL,
                    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES jobs(id),
                    UNIQUE (job_id, milestone)
                )
            """))
            conn.commit()
            print("✅ job_notification_milestones table created successfully!")
        else:
            print("⚠️  Table job_notification_milestones already exists, skipping...")
        
        print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()

