# Frames Project - Complete Developer Guide

## 📱 Project Overview

**Frames** is a mobile social scrapbook app that lets users capture moments daily, organize them into scrapbooks, and create yearbooks. The tagline: **"Capture now, organize never, remember forever."**

**Current Status**: Stage 1 MVP with:
- ✅ Core architecture established
- ✅ React Native mobile app
- ✅ Express API backend
- ✅ PostgreSQL database schema
- ✅ Background job workers (Redis/BullMQ)
- ✅ Scrapbook rendering engine
- ✅ Ready for Play Store deployment (APK/AAB builds)

---

## 🏗️ Technology Stack

### Frontend (Mobile)
- **Framework**: React Native (v0.75.5) with Expo
- **Router**: Expo Router (file-based routing)
- **State Management**: Zustand
- **API Client**: React Query + Supabase JS SDK
- **Animation**: React Native Reanimated
- **UI Libraries**: Custom components + Expo Vector Icons

### Backend (API)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Job Queue**: BullMQ
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

### Worker Services
- **Language**: TypeScript/Node.js
- **Job Processing**: BullMQ queues
- **Media Processing**: FFmpeg integration
- **Vision APIs**: Image analysis for highlights
- **Storage**: S3-compatible (Supabase, AWS, etc.)

### Database
- **Type**: PostgreSQL with Prisma ORM
- **Schema**: Defined in `services/api/prisma/schema.prisma`
- **Migrations**: Version-controlled via Prisma
- **Caching**: Redis for sessions and real-time data

### Shared Packages (pnpm Monorepo)
- `@frames/types`: TypeScript interfaces and types
- `@frames/ui`: Reusable UI components
- `@frames/config`: Shared configuration
- `@frames/templates`: Scrapbook templates

---

## 📁 Project Structure

```
.
├── apps/
│   ├── mobile/                 # React Native Expo app
│   │   ├── app/               # Expo Router screens
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API clients (Supabase, HTTP)
│   │   ├── store/             # Zustand state stores
│   │   ├── app.json           # Expo config
│   │   ├── eas.json           # EAS Build config
│   │   └── package.json       # Mobile dependencies
│   └── web-share/             # Share link web interface
│
├── services/
│   ├── api/                   # Express REST API
│   │   ├── src/
│   │   │   ├── app.ts         # Express app setup
│   │   │   ├── index.ts       # Server entry point
│   │   │   ├── database/      # Prisma setup
│   │   │   ├── middleware/    # Auth, validation, error handling
│   │   │   ├── modules/       # Feature modules (auth, posts, feed, etc.)
│   │   │   ├── services/      # Business logic
│   │   │   └── utils/         # Helpers
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   └── seed.ts        # Sample data seeding
│   │   └── package.json
│   │
│   ├── worker/                # Background job processor
│   │   ├── src/
│   │   │   ├── index.ts       # Worker setup
│   │   │   ├── jobs/          # Job handlers
│   │   │   ├── services/      # Media/vision processing
│   │   │   └── utils/         # Helpers
│   │   └── package.json
│   │
│   └── scrapbook-renderer/    # Deterministic scrapbook generator
│       └── src/
│           └── [rendering logic]
│
├── packages/
│   ├── types/                 # Shared TypeScript types
│   │   └── src/
│   │       └── index.ts       # All exported types
│   │
│   ├── ui/                    # Shared React Native components
│   │   └── src/
│   │       └── components/
│   │
│   ├── config/                # Shared config (constants, env)
│   │   └── src/
│   │       └── index.ts
│   │
│   └── templates/             # Scrapbook template definitions
│       └── src/
│           └── templates/
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System design
│   ├── DATA_FLOW.md          # User/data flow diagrams
│   ├── DATABASE.md           # Schema documentation
│   ├── MOBILE_APP_GUIDE.md   # Mobile development guide
│   ├── PLAY_STORE_RELEASE.md # App Store release process
│   ├── DEPLOYMENT.md         # Production deployment
│   └── API.md                # API endpoint documentation
│
├── infrastructure/            # DevOps configs
│   ├── docker/               # Docker setup
│   └── terraform/            # Infrastructure as Code
│
├── docker-compose.yml        # Local development environment
├── pnpm-workspace.yaml       # Monorepo workspace config
├── package.json              # Root workspace scripts
├── render.yaml               # Render.com deployment config
├── railway.json              # Railway.app deployment config
├── fly.toml                  # Fly.io deployment config
└── eas.json                  # EAS Build configuration (APK/AAB)
```

---

## 🔄 Core Data Flow

### 1. **User Authentication Flow**
```
User Login
  ↓
Supabase Auth or API JWT
  ↓
Refresh Token Rotation
  ↓
Secure Session Storage (Expo Secure Store)
```

### 2. **Posting/Capture Flow**
```
User captures photo/video
  ↓
App requests signed S3 upload URL from API
  ↓
App uploads media directly to S3
  ↓
App notifies API of successful upload
  ↓
API creates Post record in PostgreSQL
  ↓
BullMQ queues media processing job
  ↓
Worker processes media (FFmpeg, vision API, etc.)
  ↓
Post appears in user's feed (visible for 24 hours)
  ↓
After 24h, archive worker creates daily Frame
  ↓
Monthly Collage aggregates frames
  ↓
Yearbook combines everything
```

### 3. **Feed Generation**
```
User opens app
  ↓
API queries PostgreSQL:
  - Friends' posts from last 24 hours
  - Apply privacy rules
  - Sort by relevance/recency
  ↓
Cache results in Redis (TTL: 5 min)
  ↓
Return feed to mobile app
```

### 4. **Scrapbook Rendering**
```
Scrapbook generation triggered (daily/monthly/yearly)
  ↓
Scrapbook-renderer service reads template
  ↓
Queries media from S3 (via CDN)
  ↓
Renders deterministic output (same input = same output)
  ↓
Stores result in S3 + CDN
  ↓
User can view/download/export
```

---

## 🚀 Key Components Explained

### **Mobile App (`apps/mobile/`)**

**Screen Structure** (Expo Router, file-based):
- `app/index.tsx` - Onboarding/intro
- `app/login.tsx` - Login screen
- `app/register.tsx` - Registration
- `app/(tabs)/` - Main tabbed interface:
  - `home.tsx` - Feed view
  - `camera.tsx` - Capture screen
  - `profile.tsx` - User profile
  - `archive.tsx` - Past frames/scrapbooks
  - `search.tsx` - Friend search
- `app/settings.tsx` - User settings
- `app/[user]/profile.tsx` - Other user's profile
- `app/comments/[id].tsx` - Comment thread

**State Management** (`store/`):
- `authStore.ts` - User auth state
- `appStore.ts` - Global app state (current user, cached posts, etc.)

**Services** (`services/`):
- `supabase.ts` - Supabase client + auth helpers
- `api.ts` - HTTP API client for custom endpoints

**Components** (`components/`):
- `FrameCard.tsx` - Displays a single post/frame
- `FrameButton.tsx` - Custom button
- `PolaroidFrame.tsx` - Polaroid-style photo display
- `PrivacySelector.tsx` - Privacy level picker
- `ReactionButton.tsx` - Like/comment/share actions
- `UserHeader.tsx` - User info header
- etc.

### **API Server** (`services/api/`)

**Modules** (in `src/modules/`):
1. **Auth Module** - JWT generation, refresh tokens, session management
2. **Users Module** - Profile CRUD, friend requests, blocking
3. **Posts Module** - Create, delete, update posts
4. **Feed Module** - Feed generation with privacy rules
5. **Archive Module** - Daily/monthly/yearly frame generation
6. **Notifications Module** - Follow requests, comments, etc.
7. **Search Module** - Friend/post search
8. **Exports Module** - Export options (download, share links)

**Middleware** (`src/middleware/`):
- `authMiddleware.ts` - JWT verification
- `errorHandler.ts` - Global error handling
- `validation.ts` - Zod validation
- `rateLimit.ts` - Rate limiting

**Database** (`src/database/`):
- `client.ts` - Prisma client setup
- Models defined in `prisma/schema.prisma`

### **Worker** (`services/worker/`)

**Jobs**:
1. **Media Processing** - FFmpeg video/image processing
2. **Vision Analysis** - AI-powered highlight detection
3. **Frame Generation** - Daily/monthly/yearly aggregation
4. **Upload Confirmation** - Confirm S3 uploads
5. **Notification Dispatch** - Send push notifications

**Execution**:
- Redis queues messages
- Worker polls queue and executes jobs
- Results saved to PostgreSQL + S3

### **Scrapbook Renderer** (`services/scrapbook-renderer/`)

Deterministic engine that:
- Takes template + media list
- Renders consistent scrapbook layouts
- Outputs image/PDF
- Is stateless (same input = same output always)

### **Shared Packages**

**`packages/types`**: All TypeScript interfaces used across app
- User, Post, Feed, Scrapbook types
- API request/response DTOs
- Enums for status, privacy levels, etc.

**`packages/ui`**: Reusable components used by mobile + web
- Buttons, cards, inputs
- Theme/styling system

**`packages/config`**: Shared constants
- API endpoints
- Feature flags
- Expo project ID
- Environment names

**`packages/templates`**: Scrapbook template definitions
- Layout templates
- Style presets
- Default configurations

---

## 📊 Database Schema (Key Tables)

```sql
-- Users table (via Supabase Auth or custom)
users {
  id (UUID),
  email,
  username,
  avatar_url,
  privacy_level,
  created_at,
  updated_at
}

-- Posts (daily frames)
posts {
  id,
  user_id,
  media_url,
  caption,
  location,
  privacy,
  created_at,
  expires_at  -- 24 hour expiry
}

-- Friendships
friendships {
  id,
  user_id,
  friend_id,
  status (pending, accepted, blocked),
  created_at
}

-- Archived frames (after 24h)
archive {
  id,
  user_id,
  date,
  frame_image_url,
  posts_count,
  created_at
}

-- Monthly collages
monthlies {
  id,
  user_id,
  year,
  month,
  collage_image_url,
  created_at
}

-- Yearbooks
yearbooks {
  id,
  user_id,
  year,
  book_image_url,
  created_at
}
```

---

## ⚙️ Build & Deployment Configurations

### **Mobile Build (EAS)**

**File**: `apps/mobile/eas.json`

3 Build Profiles:
1. **development** - Internal debug APK for testing
2. **preview** - Shareable APK for friends/testers (current issue fixed)
3. **production** - Google Play release (AAB format)

**Build Commands**:
```bash
pnpm build:apk      # Build preview APK (for testing)
pnpm build:aab      # Build production AAB (for Play Store)
pnpm build:android  # Full production pipeline
pnpm submit:android # Submit to Play Store
```

**Why APK Build Failed** (Fixed):
- `react-native-reanimated@3.10.1` requires React Native 0.78+
- Project had RN 0.74.5 (incompatible)
- **Solution**: Updated to RN 0.75.5 ✅

### **Backend Deployment Targets**

**Docker**: Local or cloud
- `services/api/Dockerfile` - Production API image
- `services/worker/Dockerfile` - Production worker image
- `apps/mobile/Dockerfile.web` - Web export (Nginx)

**Cloud Platforms Supported**:
- **Render.com**: `render.yaml` - All-in-one deployment
- **Fly.io**: `fly.toml` - API microservice
- **Railway**: `railway.json` - API starter config

**Environment Variables** (set in production):
```
DATABASE_URL          # PostgreSQL connection
REDIS_URL             # Redis connection
JWT_SECRET            # Token signing key
JWT_REFRESH_SECRET    # Refresh token key
AWS_ACCESS_KEY_ID     # S3 credentials
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME
CDN_URL               # CloudFront/Cloudflare URL
EXPO_PUBLIC_API_URL   # Mobile points to this
SENTRY_DSN            # Error tracking
```

---

## 🛠️ Development Workflow

### **Local Setup** (Complete)
```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Start infrastructure
docker-compose up postgres redis

# 4. Setup database
pnpm db:generate  # Prisma client
pnpm db:migrate   # Run migrations
pnpm seed         # Insert sample data

# 5. Start services (in separate terminals)
pnpm --filter @frames/api dev       # API on :3000
pnpm --filter @frames/worker dev    # Worker process
pnpm --filter @frames/mobile dev    # Mobile on :8081

# 6. Access
# - API: http://localhost:3000
# - Mobile: http://localhost:8081 (or scan QR)
# - Local DB: services/api/.local/local-db.json
```

### **Without Docker** (JSON Backend)
```powershell
# Builds API with local JSON instead of PostgreSQL
$env:LOCAL_JSON_DB="true"
$env:JWT_SECRET="dev-secret"
pnpm --filter @frames/api build
node services/api/dist/services/api/src/index.js
```

### **Scripts** (Root `package.json`)
```bash
pnpm dev          # All services in parallel
pnpm build        # Build all packages
pnpm lint         # Type-check all
pnpm test         # Run all tests
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm seed         # Seed sample data
```

---

## 🔧 What Needs To Be Done (Next Steps)

### **Immediate Priorities**
1. ✅ **APK Build** - Fixed React Native version mismatch (0.74.5 → 0.75.5)
2. **Play Store Setup** - Create developer account, sign app with keystore
3. **Testing** - Download APK from EAS, test on real device
4. **Backend Hardening** - Add input validation, error handling improvements
5. **Privacy Enforcement** - Ensure API checks friendship status for feed

### **Feature Development**
- Push notifications (already has expo-notifications dependency)
- Direct messaging between friends
- Story-like features (expiring posts)
- Better highlight detection (improve vision API integration)
- Offline mode (local storage of posts before upload)
- Video playback optimization

### **Infrastructure**
- Set up Sentry error tracking
- Configure CDN for S3 media delivery
- Set up PostgreSQL backups
- Configure Redis persistence
- SSL/HTTPS certificates

### **Security**
- Input sanitization (already using Zod)
- CORS configuration refinement
- Rate limiting adjustment
- API key rotation strategy
- S3 bucket security hardening

### **Performance**
- Database indexing optimization
- Feed query optimization
- Image compression strategy
- Cache invalidation logic
- Worker job timeout tuning

### **Monitoring**
- Log aggregation (ELK stack or cloud solutions)
- Performance monitoring
- User analytics
- Error rate alerts
- Database query monitoring

---

## 📚 Key Files to Edit When Modifying

### **To Add a New API Endpoint**:
1. Create file in `services/api/src/modules/[feature]/routes.ts`
2. Define in `services/api/src/modules/[feature]/controller.ts`
3. Add middleware if needed in `services/api/src/middleware/`
4. Register route in `services/api/src/app.ts`
5. Update types in `packages/types/src/index.ts`

### **To Add a New Screen**:
1. Create `.tsx` file in `apps/mobile/app/` (Expo Router auto-routes)
2. Import shared components from `apps/mobile/components/`
3. Use Zustand stores from `apps/mobile/store/`
4. Call API via `services/supabase.ts` or `services/api.ts`

### **To Change Database Schema**:
1. Edit `services/api/prisma/schema.prisma`
2. Run `pnpm db:migrate` (creates migration)
3. Update types in `packages/types/src/index.ts`
4. Adjust API queries to match new schema

### **To Add a Worker Job**:
1. Create job handler in `services/worker/src/jobs/[jobName].ts`
2. Queue it from API: `queue.add('jobName', data)`
3. Worker automatically picks up from Redis queue

### **To Modify UI Components**:
1. Edit `apps/mobile/components/[Component].tsx`
2. Or shared: `packages/ui/src/components/`
3. Re-import where used

---

## 🎯 Current State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Mobile App | ✅ Ready | APK build now works (RN 0.75.5) |
| API | ✅ Functional | Express + Prisma + PostgreSQL |
| Worker | ✅ Functional | BullMQ queue system running |
| Database | ✅ Schema Ready | PostgreSQL with Prisma ORM |
| Authentication | ✅ JWT | Refresh token rotation implemented |
| Storage | ✅ S3 Ready | Signed URLs for uploads |
| Deployment | ✅ Configs Ready | Render, Railway, Fly.io configs included |
| **Next Build**: APK download from EAS + Play Store submission |

---

## 📞 Important Links

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com
- **Your Build**: https://expo.dev/accounts/taehabeom/projects/frames/builds/ac9b48ad-8185-40ad-9e53-0779acef48e6

---

**You now have a complete understanding of the Frames project structure, data flow, build system, and deployment architecture. Feel free to modify any component following the patterns established!**
