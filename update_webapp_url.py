#!/usr/bin/env python3
"""
Script to update the TELEGRAM_WEBAPP_URL in the backend .env file
"""
import sys
import re

def update_webapp_url(new_url):
    env_file = "backend/.env"
    
    try:
        # Read the current .env file
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Update the TELEGRAM_WEBAPP_URL
        pattern = r'TELEGRAM_WEBAPP_URL=.*'
        replacement = f'TELEGRAM_WEBAPP_URL={new_url}'
        
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
        else:
            # Add the line if it doesn't exist
            content += f'\nTELEGRAM_WEBAPP_URL={new_url}\n'
        
        # Write back to file
        with open(env_file, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated TELEGRAM_WEBAPP_URL to: {new_url}")
        
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python update_webapp_url.py <new_ngrok_url>")
        print("Example: python update_webapp_url.py https://abc123.ngrok-free.app")
        sys.exit(1)
    
    new_url = sys.argv[1]
    if update_webapp_url(new_url):
        print("🔄 Please restart the backend server for changes to take effect")
    else:
        sys.exit(1)
