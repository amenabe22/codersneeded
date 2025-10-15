#!/usr/bin/env python3
"""
Script to update bot URLs with ngrok URLs
"""
import sys

def update_bot_urls(frontend_url, backend_url):
    webhook_file = "backend/app/routers/webhook.py"
    
    try:
        # Read the webhook file
        with open(webhook_file, 'r') as f:
            content = f.read()
        
        # Update all localhost:3000 URLs to frontend ngrok URL
        content = content.replace("http://localhost:3000", frontend_url)
        
        # Write back to file
        with open(webhook_file, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated bot URLs:")
        print(f"   Frontend: {frontend_url}")
        print(f"   Backend: {backend_url}")
        
        # Update webhook
        import subprocess
        result = subprocess.run([
            "curl", "-X", "POST",
            "https://api.telegram.org/bot1386084322:AAFqtVW85NiouhfMb0z5p-fEjnJlu8_TO70/setWebhook",
            "-H", "Content-Type: application/json",
            "-d", f'{{"url": "{backend_url}/api/webhook"}}'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Webhook updated successfully")
        else:
            print(f"❌ Webhook update failed: {result.stderr}")
        
        print("🔄 Please restart the bot for changes to take effect")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update_bot_urls.py <frontend_ngrok_url> <backend_ngrok_url>")
        print("Example: python update_bot_urls.py https://abc123.ngrok-free.app https://xyz789.ngrok-free.app")
        sys.exit(1)
    
    frontend_url = sys.argv[1]
    backend_url = sys.argv[2]
    
    if update_bot_urls(frontend_url, backend_url):
        print("✅ Setup complete!")
    else:
        sys.exit(1)
