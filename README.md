# Underboss

> A modern job marketplace platform connecting job posters with skilled workers through mobile and web applications.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/backend-Flask-green.svg)](back-end/)
[![Frontend](https://img.shields.io/badge/frontend-React%20Native-blue.svg)](front-end/)
[![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](back-end/create.sql)

## 📖 Overview

Underboss is a full-stack job marketplace application that enables users to post jobs (PAPS), receive applications (SPAP), assign work (ASAP), process payments, and provide ratings. The platform features:

- **📱 Cross-Platform**: Native iOS/Android apps + Web application
- **🗺️ Location-Based**: Find nearby jobs using interactive maps (OpenStreetMap)
- **💬 Real-Time Chat**: Communication between job posters and workers
- **💰 Payment Management**: Integrated payment tracking and processing
- **⭐ Rating System**: Two-way ratings for quality assurance
- **📅 Scheduling**: Flexible time slot management for jobs
- **🖼️ Media Support**: Upload images/videos for jobs and applications

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.12+, PostgreSQL 14+
- **Frontend**: Node.js 20+, npm 10+
- **Mobile**: Android Studio / Xcode (for native builds)

### Backend Setup (5 minutes)

```bash
# Clone repository
git clone <repo-url>
cd underboss/back-end

# Create database
createdb underboss
psql underboss < create.sql
psql underboss < data.sql

# Configure environment
export APP_NAME=underboss
export APP_CONFIG=local.conf
export APP_SECRET=your-secret-key

# Install & run
make dev
make run
```

Backend runs at `http://localhost:5000`

### Frontend Setup (5 minutes)

```bash
# Navigate to frontend
cd ../front-end

# Install dependencies
npm install

# Run web version
npm run web
```

Web app runs at `http://localhost:8080`

**For mobile development**, see [Frontend README](front-end/README.md)

## 📂 Project Structure

```
underboss/
├── back-end/              # Python Flask API
│   ├── api/              # Modular route handlers
│   ├── docs/             # Backend documentation
│   ├── media/            # User-uploaded files
│   ├── app.py            # Application entry
│   ├── create.sql        # Database schema
│   └── requirements.txt  # Python dependencies
│
├── front-end/            # React Native application
│   ├── src/              # Source code
│   │   ├── cache/       # State management (Jotai)
│   │   ├── serve/       # API service layer
│   │   ├── feed/        # Job feed components
│   │   ├── chat/        # Messaging system
│   │   └── ...
│   ├── android/          # Android native code
│   ├── ios/              # iOS native code
│   └── package.json      # Node dependencies
│
├── DEV.md                # Complete technical documentation
└── README.md             # This file
```

## 🏗️ Architecture

### System Components

```
┌─────────────────┐
│  Mobile Apps    │  React Native (iOS/Android)
│  Web App        │  React + TypeScript
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Flask API      │  Python 3.12+
│  + FlaskAuth    │  JWT/Basic Auth
└────────┬────────┘
         │ SQL
         ↓
┌─────────────────┐
│  PostgreSQL     │  14+
│  + Extensions   │  uuid-ossp, spatial
└─────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React Native 0.82, TypeScript 5.8, Jotai (state), React Navigation |
| **Backend** | Flask 3.x, FlaskSimpleAuth 35.6+, anodb 15.0+, aiosql, Pydantic |
| **Database** | PostgreSQL 14+, 19 tables, spatial functions |
| **Media** | Filesystem storage, Pillow processing, react-native-image-picker |
| **Maps** | WebView + Leaflet.js + OpenStreetMap (no API key required) |
| **Build Tools** | Webpack 5, Metro, Gradle, CocoaPods, Make |

## 🔑 Key Features

### Job Management (PAPS)
- Create job postings with title, description, location, payment
- Add multiple media attachments (images/videos)
- Define flexible schedules with time slots
- Categorize jobs with multiple categories
- Track status: draft → published → assigned → completed

### Applications (SPAP)
- Apply to jobs with cover message
- Attach portfolio media
- Track application status
- View acceptance/rejection

### Assignments (ASAP)
- Automatic assignment creation on application acceptance
- Status tracking: active → in_progress → completed
- Automatic payment generation on completion
- Work proof attachments

### Payments
- Auto-generated from completed assignments
- Track payment status and amounts
- View transaction history

### Ratings & Reviews
- Two-way rating system (poster ↔ worker)
- Written comments
- Average rating calculation

### Chat System
- Real-time messaging between users
- Thread-based conversations
- Participant management
- Message history

### User Profiles
- Customizable profile information
- Avatar upload
- Work experience tracking
- Interest/category preferences
- Public profile viewing

## 📚 Documentation

### Complete Documentation
- **[DEV.md](DEV.md)** - Complete technical documentation with:
  - Architecture deep dive
  - Database schema (19 tables)
  - API integration patterns
  - State management with Jotai
  - Authentication & security
  - Performance optimization
  - Testing procedures
  - Deployment guides
  - Troubleshooting

### Backend Documentation
- **[Backend README](back-end/docs/README.md)** - Architecture & concepts
- **[API Routes](back-end/docs/routes.md)** - Complete endpoint reference (100+ endpoints)
- **[Testing Guide](back-end/docs/testing.md)** - Test suite & bash scripts
- **[Database Schema](back-end/docs/database_schema.mmd)** - Mermaid diagram

### Frontend Documentation
- **[Frontend README](front-end/README.md)** - Development setup & build
- **[Frontend Routes](front-end/routes.md)** - API endpoint reference
- **[DEV Guide](front-end/src/DEV.md)** - Architecture & refactoring notes

### Database
- **[create.sql](back-end/create.sql)** - Full schema definition
- **[queries.sql](back-end/queries.sql)** - All SQL queries (aiosql format)
- **[data.sql](back-end/data.sql)** - Sample seed data

## 🔄 Development Workflow

### Typical Development Cycle

```bash
# 1. Start backend
cd back-end && make run

# 2. Start frontend (separate terminal)
cd front-end && npm start

# 3. Make changes
# Edit code in your IDE

# 4. Test changes
make test                    # Backend tests
npm test                     # Frontend tests

# 5. Commit
git add .
git commit -m "feat: description"
git push
```

### Common Commands

**Backend**
```bash
make dev          # Setup development environment
make run          # Start Flask server
make test         # Run pytest
make db.clean     # Drop all tables
make db.create    # Create schema
make db.data      # Load seed data
```

**Frontend**
```bash
npm install       # Install dependencies
npm start         # Start Metro bundler
npm run web       # Run web version
npm run android   # Run Android app
npm run ios       # Run iOS app
npm test          # Run Jest tests
npm run lint      # Run ESLint
```

## 🗄️ Database Schema

### Core Tables (19 total)

```
USER → USER_PROFILE → USER_EXPERIENCE
  ↓
PAPS → PAPS_CATEGORY → CATEGORY
  ↓         ↓              ↑
PAPS_MEDIA  PAPS_SCHEDULE  USER_INTEREST
  ↓
SPAP → SPAP_MEDIA
  ↓
ASAP → ASAP_MEDIA
  ↓
PAYMENT
  ↓
RATING

CHAT_THREAD → CHAT_PARTICIPANT
      ↓
CHAT_MESSAGE

PAPS → COMMENT
```

### Key Relationships
- **CASCADE**: Deleting PAPS removes SPAP, media, schedules
- **RESTRICT**: Cannot delete PAPS with active ASAP
- **Auto-triggers**: PAYMENT creation on ASAP completion

See [DEV.md - Database Architecture](DEV.md#database-architecture) for complete schema.

## 🔐 Authentication

### Supported Methods
1. **JWT Bearer Token** (default)
   ```http
   Authorization: Bearer eyJhbGc...
   ```

2. **HTTP Basic Auth**
   ```http
   Authorization: Basic dXNlcjpwYXNz
   ```

3. **Query Parameter**
   ```http
   GET /paps?token=eyJhbGc...
   ```

### Token Lifecycle
- **Expiration**: 24 hours
- **Generation**: On login with valid credentials
- **Storage**: AsyncStorage (mobile), localStorage (web)
- **Refresh**: Re-login required after expiry

## 🧪 Testing

### Backend Testing

```bash
# Run full test suite
cd back-end && make test

# Run comprehensive bash tests (100+ scenarios)
./comprehensive_test.sh

# Run specific test
pytest test.py::test_user_registration -v

# With coverage
pytest --cov=api --cov-report=html
```

### Frontend Testing

```bash
# Run Jest tests
cd front-end && npm test

# With coverage
npm test -- --coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 🚀 Deployment

### Backend (Production)

```bash
# Using Gunicorn
pip install gunicorn
gunicorn -c gunicorn.conf.py app:app

# Using Docker
docker build -t underboss-backend .
docker run -p 5000:5000 underboss-backend
```

### Frontend (Production)

```bash
# Android APK
cd android && ./gradlew assembleRelease

# iOS App Store
open ios/Underboss.xcworkspace
# Product → Archive → Distribute

# Web Bundle
npm run build
# Deploy dist/ to static hosting
```

See [DEV.md - Deployment](DEV.md#deployment) for complete guides.

## 🛠️ Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Verify database exists
psql -l | grep underboss
```

**Frontend build fails**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Android: clean build
cd android && ./gradlew clean && cd ..
```

**Database errors**
```bash
# Reset database
make db.clean
make db.create
make db.data
```

**"Network request failed"**
- Verify backend is running on correct port
- Check `API_BASE_URL` in [front-end/src/serve/serv.ts](front-end/src/serve/serv.ts)
- For Android emulator: `adb reverse tcp:5000 tcp:5000`

See [DEV.md - Troubleshooting](DEV.md#troubleshooting) for more solutions.

## 📊 API Endpoints

### Quick Reference

| Category | Endpoints | Authentication |
|----------|-----------|----------------|
| **System** | `/uptime`, `/version`, `/stats` | Optional |
| **Auth** | `/register`, `/login` | Public |
| **Users** | `/users`, `/users/{id}` | Admin only |
| **Profile** | `/profile` (GET/PUT/DELETE) | Required |
| **Categories** | `/categories` (GET/POST/PUT/DELETE) | Varies |
| **PAPS** | `/paps` (GET/POST/PUT/DELETE) | Required |
| **SPAP** | `/spap` (GET/POST/PUT/DELETE) | Required |
| **ASAP** | `/asap` (GET/POST/PUT/PATCH/DELETE) | Required |
| **Payments** | `/payments` (GET/POST/PUT) | Required |
| **Ratings** | `/ratings` (GET/POST) | Required |
| **Comments** | `/comments` (GET/POST/DELETE) | Required |
| **Chats** | `/chats`, `/chats/{id}/messages` | Required |

See [API Routes Documentation](back-end/docs/routes.md) for complete reference with request/response examples.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Make** your changes with tests
4. **Update** documentation
5. **Commit** following [conventional commits](https://www.conventionalcommits.org/)
6. **Push** to your branch (`git push origin feat/amazing-feature`)
7. **Open** a Pull Request

### Code Style
- **Backend**: Follow PEP 8, use type hints, add docstrings
- **Frontend**: Follow ESLint config, use TypeScript types
- **Commits**: `type(scope): subject` format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Development Team** - Initial work - [Underboss](https://github.com/underboss)

## 🙏 Acknowledgments

- **Flask** & **FlaskSimpleAuth** for robust backend framework
- **React Native** for cross-platform mobile development
- **PostgreSQL** for reliable data storage
- **OpenStreetMap** for free mapping solution
- **Jotai** for elegant state management

## 📞 Support

- **Documentation**: See [DEV.md](DEV.md) for comprehensive technical details
- **Issues**: [GitHub Issues](https://github.com/underboss/issues)
- **Email**: support@underboss.com

---

**Built with ❤️ using React Native, Flask, and PostgreSQL**

## Makefile

- `make dev` installation des environnement de développement front et back.
- `make clean.dev` nettoyage des environnement de développement front et back.
