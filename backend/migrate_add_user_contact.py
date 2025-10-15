"""
Migration script to add phone and email columns to users table
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
        # Check if columns already exist (SQLite-specific)
        result = conn.execute(text("""
            PRAGMA table_info(users)
        """))
        
        columns = [row[1] for row in result]
        
        # Add phone column if it doesn't exist
        if 'phone' not in columns:
            print("Adding phone column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN phone VARCHAR
            """))
            conn.commit()
            print("✅ Phone column added successfully!")
        else:
            print("⚠️  Column phone already exists, skipping...")
        
        # Check columns again for email
        result = conn.execute(text("""
            PRAGMA table_info(users)
        """))
        columns = [row[1] for row in result]
        
        # Add email column if it doesn't exist
        if 'email' not in columns:
            print("Adding email column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN email VARCHAR
            """))
            conn.commit()
            print("✅ Email column added successfully!")
        else:
            print("⚠️  Column email already exists, skipping...")
        
        print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()

