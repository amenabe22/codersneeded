"""
Migration script to add resume_url column to applications table
"""
import sqlite3

def migrate():
    # Connect to database
    conn = sqlite3.connect('telegram_jobs.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(applications)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'resume_url' not in columns:
            # Add resume_url column
            cursor.execute("""
                ALTER TABLE applications 
                ADD COLUMN resume_url VARCHAR
            """)
            conn.commit()
            print("✅ Successfully added resume_url column to applications table")
        else:
            print("ℹ️  resume_url column already exists")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

