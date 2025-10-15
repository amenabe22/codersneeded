# Telegram Job Platform

A comprehensive job platform built as a Telegram Mini App with a powerful FastAPI backend. This platform allows job seekers to find opportunities and employers/individuals to post jobs, all within the Telegram ecosystem.

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
- **Authentication**: Telegram WebApp integration
- **Job Management**: CRUD operations for job postings
- **Application System**: Job applications with status tracking
- **Profile Management**: Separate profiles for job seekers, employers, and individuals
- **Notifications**: Real-time notifications via Telegram Bot
- **File Storage**: Local file storage for CVs and company logos

### Frontend (Next.js + Telegram Mini App)
- **Job Feed**: Browse and search jobs with filters
- **Job Details**: Detailed job view with application functionality
- **Profile Management**: Complete profile setup for all user types
- **Job Posting**: Create and manage job postings
- **Application Tracking**: Track application status

### Telegram Bot
- **Light Layer**: Redirects to Mini App for all actions
- **Notifications**: Sends job matches and application updates
- **Menu System**: Quick access to main features

## 🚀 Features

### For Job Seekers
- ✅ Create and manage profile
- ✅ Browse and search jobs with advanced filters
- ✅ Apply for jobs with cover letters
- ✅ Track application status
- ✅ Upload CV for applications

### For Employers
- ✅ Create company profile
- ✅ Post and manage job listings
- ✅ Review applications
- ✅ Accept/reject candidates
- ✅ Upload company logos

### For Individuals
- ✅ Post jobs without company affiliation
- ✅ Manage job listings
- ✅ Review applications

### General Features
- ✅ Real-time notifications via Telegram
- ✅ Responsive design optimized for mobile
- ✅ Telegram theme integration
- ✅ File upload support
- ✅ Advanced search and filtering

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **SQLAlchemy** - ORM for database operations
- **Redis** - Caching and session storage
- **Python Telegram Bot** - Bot integration
- **JWT** - Authentication tokens
- **Alembic** - Database migrations

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Lucide React** - Beautiful icons
- **Telegram WebApp SDK** - Telegram integration

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Backend Setup

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Set up database**
```bash
# Create PostgreSQL database
createdb telegram_jobs

# Run migrations (when available)
alembic upgrade head
```

5. **Run the backend**
```bash
python run.py
```

### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Run the frontend**
```bash
npm run dev
```

### Telegram Bot Setup

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Save the bot token

2. **Set up Web App**
   - Configure the bot with `/setmenubutton`
   - Set the Web App URL to your frontend URL
   - Update bot token in backend `.env`

3. **Run the bot**
```bash
cd backend
python -m app.bot
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost/telegram_jobs

# Redis
REDIS_URL=redis://localhost:6379

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBAPP_URL=https://your-domain.com

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# App
DEBUG=True
CORS_ORIGINS=["*"]
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📱 Usage

### For Job Seekers
1. Start the Telegram bot
2. Click "Browse Jobs" to see available positions
3. Use filters to narrow down search results
4. Click on jobs to view details
5. Apply with a cover letter
6. Track applications in "My Applications"

### For Employers/Individuals
1. Start the Telegram bot
2. Set up your profile/company
3. Click "Post Job" to create job listings
4. Manage jobs in "My Jobs"
5. Review applications and update status

## 🔐 Security Features

- **Telegram WebApp Authentication**: Secure user verification
- **JWT Tokens**: Secure API authentication
- **File Upload Validation**: Type and size restrictions
- **Input Sanitization**: XSS protection
- **CORS Configuration**: Controlled cross-origin requests

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL and Redis on your server
2. Configure environment variables for production
3. Use a WSGI server like Gunicorn
4. Set up reverse proxy with Nginx

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update `TELEGRAM_WEBAPP_URL` in backend configuration

### Bot Deployment
1. Run the bot as a systemd service
2. Use process managers like PM2 or supervisor
3. Set up monitoring and logging

## 📊 Database Schema

### Core Tables
- `users` - User accounts with Telegram integration
- `companies` - Company profiles for employers
- `job_seeker_profiles` - Detailed profiles for job seekers
- `jobs` - Job postings with full details
- `applications` - Job applications with status tracking
- `notifications` - In-app notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Future Enhancements

- [ ] Advanced job matching algorithm
- [ ] Video interview integration
- [ ] Salary analytics
- [ ] Company reviews
- [ ] Job recommendations
- [ ] Multi-language support
- [ ] Advanced notification preferences
- [ ] Job bookmarking
- [ ] Application templates
- [ ] Analytics dashboard for employers
