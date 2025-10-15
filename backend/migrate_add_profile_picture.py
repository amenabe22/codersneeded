"""
Migration script to add profile_picture_url column to users table
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
        # Check if column already exists (SQLite-specific)
        result = conn.execute(text("""
            PRAGMA table_info(users)
        """))
        
        columns = [row[1] for row in result]
        
        if 'profile_picture_url' not in columns:
            print("Adding profile_picture_url column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN profile_picture_url VARCHAR
            """))
            conn.commit()
            print("✅ Migration completed successfully!")
        else:
            print("⚠️  Column profile_picture_url already exists, skipping...")

if __name__ == "__main__":
    migrate()

