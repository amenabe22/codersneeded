#!/usr/bin/env python3
"""
Migration script to add new Telegram user fields to the database
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add new columns to the users table"""
    db_path = Path(__file__).parent / "telegram_jobs.db"
    
    if not db_path.exists():
        print("❌ Database file not found. Please run the backend first to create the database.")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ("photo_url", "TEXT"),
            ("language_code", "TEXT"), 
            ("is_premium", "BOOLEAN DEFAULT 0")
        ]
        
        added_columns = []
        for column_name, column_type in new_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                    added_columns.append(column_name)
                    print(f"✅ Added column: {column_name}")
                except sqlite3.Error as e:
                    print(f"❌ Error adding column {column_name}: {e}")
            else:
                print(f"ℹ️  Column {column_name} already exists")
        
        conn.commit()
        conn.close()
        
        if added_columns:
            print(f"🎉 Migration completed! Added columns: {', '.join(added_columns)}")
        else:
            print("✅ Database is already up to date!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Running database migration...")
    success = migrate_database()
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")
        exit(1)
