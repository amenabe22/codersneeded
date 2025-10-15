'use client'

import { useTelegramWebApp, useTelegramUser } from '@/lib/telegram'

export default function TelegramDemoPage() {
  const webApp = useTelegramWebApp()
  const telegramUser = useTelegramUser()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Telegram User Data Demo</h1>
      
      {telegramUser ? (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">✅ Telegram User Data Available</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <strong>User ID (Bot ID):</strong>
                <p className="font-mono text-blue-600">{telegramUser.id}</p>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>First Name:</strong>
                <p>{telegramUser.first_name}</p>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>Last Name:</strong>
                <p>{telegramUser.last_name || 'Not provided'}</p>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <strong>Username:</strong>
                <p>@{telegramUser.username || 'Not provided'}</p>
              </div>
              
              {telegramUser.photo_url && (
                <div className="bg-white p-3 rounded border md:col-span-2">
                  <strong>Profile Photo:</strong>
                  <img 
                    src={telegramUser.photo_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full mt-2"
                  />
                </div>
              )}
            </div>
          </div>

          {webApp && (
            <div className="bg-blue-100 p-4 rounded-lg">
              <h2 className="font-semibold text-blue-800 mb-2">📱 Telegram WebApp Data</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <strong>Platform:</strong>
                  <p>{webApp.platform}</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <strong>Version:</strong>
                  <p>{webApp.version}</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <strong>Color Scheme:</strong>
                  <p className="capitalize">{webApp.colorScheme}</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <strong>Viewport Height:</strong>
                  <p>{webApp.viewportHeight}px</p>
                </div>
                
                <div className="bg-white p-3 rounded border md:col-span-2">
                  <strong>Raw Init Data:</strong>
                  <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                    {webApp.initData}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Running in Development Mode</h2>
          <p className="text-yellow-700">
            This page is running outside of Telegram. In the actual Telegram Mini App, 
            you would see the user's Telegram data here.
          </p>
        </div>
      )}
      
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">💡 How to Use This Data:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>User ID:</strong> Use <code>telegramUser.id</code> as the unique identifier</li>
          <li><strong>Authentication:</strong> Send <code>webApp.initData</code> to your backend</li>
          <li><strong>Personalization:</strong> Use name/photo for user profiles</li>
          <li><strong>UI Adaptation:</strong> Use <code>webApp.colorScheme</code> for theme matching</li>
        </ul>
      </div>
    </div>
  )
}
