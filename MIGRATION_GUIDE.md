# Clerk to JWT Migration Guide

This guide explains the changes made to replace Clerk authentication with JWT-based authentication.

## Overview

The authentication system has been completely replaced:
- **Before**: Clerk (managed authentication service)
- **After**: Custom JWT (JSON Web Token) authentication

## Files Deleted

### Frontend
- `frontend/app/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in page
- `frontend/app/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up page

### Backend
- `backend/src/utils/clerkSync.ts` - Clerk user sync utility

## Files Modified

### Database Schema
**File**: `backend/prisma/schema.prisma`

**Changes**:
- ❌ Removed: `clerkId` field
- ✅ Added: `passwordHash` - Stores hashed passwords
- ✅ Added: `emailVerified` - Email verification status
- ✅ Added: `verificationToken` - Email verification token
- ✅ Added: `resetToken` - Password reset token
- ✅ Added: `resetTokenExpiry` - Password reset token expiry

### Backend Dependencies
**File**: `backend/package.json`

**Changes**:
- ❌ Removed: `@clerk/backend`
- ✅ Added: `bcrypt` - Password hashing
- ✅ Added: `jsonwebtoken` - JWT token generation/verification
- ✅ Added: `@types/bcrypt` - TypeScript types
- ✅ Added: `@types/jsonwebtoken` - TypeScript types

### Frontend Dependencies
**File**: `frontend/package.json`

**Changes**:
- ❌ Removed: `@clerk/nextjs`

## New Files Created

### Backend

1. **`backend/src/utils/jwt.ts`** - JWT utility functions
   - `generateAccessToken()` - Creates 15-minute access tokens
   - `generateRefreshToken()` - Creates 7-day refresh tokens
   - `verifyAccessToken()` - Verifies access tokens
   - `verifyRefreshToken()` - Verifies refresh tokens

2. **`backend/src/routes/auth.routes.ts`** - Authentication endpoints
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `POST /api/auth/refresh` - Refresh access token
   - `POST /api/auth/logout` - User logout
   - `GET /api/auth/me` - Get current user

3. **`backend/.env.example`** - Updated environment variables

### Frontend

1. **`frontend/app/login/page.tsx`** - Login page
2. **`frontend/app/register/page.tsx`** - Registration page
3. **`frontend/components/ui/input.tsx`** - Input component
4. **`frontend/app/api/auth/[...nextauth]/route.ts`** - API proxy to backend
5. **`frontend/.env.example`** - Updated environment variables

## Modified Files

### Backend
- `backend/src/middlewares/auth.middleware.ts` - Now verifies JWT instead of Clerk session
- `backend/prisma/schema.prisma` - Updated User model

### Frontend
- `frontend/middleware.ts` - JWT-based route protection
- `frontend/app/providers.tsx` - Removed ClerkProvider
- `frontend/app/page.tsx` - Replaced Clerk components with custom auth
- `frontend/app/profile/page.tsx` - Replaced Clerk auth with JWT

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_stock_screener"

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your_jwt_secret_key_here"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key_here"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Migration

### Step 1: Update Schema
```bash
cd backend
npx prisma migrate dev --name remove-clerk-add-jwt-fields
```

### Step 2: Handle Existing Users

If you have existing users with `clerkId`:

**Option A: Fresh Start (Development)**
```bash
# Reset database
npx prisma migrate reset
```

**Option B: Migrate Existing Users (Production)**
```typescript
// Create a migration script
// backend/src/utils/migrateUsers.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function migrateUsers() {
  // Generate temporary password for all existing users
  const tempPassword = 'TempPass123!' // User must reset on first login
  
  // Update all users without passwordHash
  await prisma.user.updateMany({
    where: { passwordHash: null },
    data: {
      passwordHash: await bcrypt.hash(tempPassword, 10),
    }
  })
  
  console.log('Migration complete. All users need to reset their password.')
}

migrateUsers()
```

## API Changes

### Authentication Flow

**Registration:**
```typescript
POST /api/auth/?endpoint=register
Body: { email, password, fullName }
Response: { user, accessToken }
```

**Login:**
```typescript
POST /api/auth/?endpoint=login
Body: { email, password }
Response: { user, accessToken }
```

**Get Current User:**
```typescript
GET /api/auth/?endpoint=me
Headers: Cookie: accessToken=...
Response: { user }
```

**Logout:**
```typescript
POST /api/auth/?endpoint=logout
Response: { success: true }
```

### Token Management

**Access Token:**
- Expires: 15 minutes
- Stored in: httpOnly cookie
- Contains: userId, email

**Refresh Token:**
- Expires: 7 days
- Stored in: httpOnly cookie
- Used to get new access tokens

## Breaking Changes

### For Frontend Developers

**Before (Clerk):**
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
const { userId } = auth();
const user = await currentUser();
```

**After (JWT):**
```typescript
const response = await fetch('/api/auth/?endpoint=me');
const data = await response.json();
const user = data.data.user;
```

### For Backend Developers

**Before (Clerk):**
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
```

**After (JWT):**
```typescript
import { authMiddleware } from './middlewares/auth.middleware';
```

## Testing

### Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Protected Route
```bash
curl http://localhost:3001/api/auth/me \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE"
```

## Security Considerations

1. **JWT Secrets**: Use strong, randomly generated secrets (32+ characters)
2. **Password Hashing**: bcrypt with cost factor 10
3. **HTTPS**: Always use HTTPS in production
4. **HttpOnly Cookies**: Prevents XSS attacks
5. **SameSite**: Strict prevents CSRF attacks
6. **Token Expiry**: Short-lived access tokens (15 min)
7. **Refresh Tokens**: Long-lived but stored securely

## Troubleshooting

### "Cannot find module 'bcrypt'"
```bash
cd backend
npm install
```

### "Cannot find module 'jsonwebtoken'"
```bash
cd backend
npm install
```

### "JWT_SECRET is not defined"
- Check your `.env` file in backend directory
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set

### "Invalid or expired token"
- Tokens expire after 15 minutes
- Refresh token should auto-renew access token
- Clear cookies and login again if refresh fails

## Rollback Plan

If you need to rollback to Clerk:

1. **Restore git commit** before migration
2. **Reinstall Clerk**: `npm install @clerk/nextjs @clerk/backend`
3. **Restore environment variables**: Add `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`
4. **Restore deleted files** from git
5. **Run database migration** to add `clerkId` back

## Next Steps

1. ✅ Install dependencies: `npm install` in both frontend and backend
2. ✅ Set up environment variables
3. ✅ Run database migration: `npx prisma migrate dev`
4. ✅ Test registration and login
5. ✅ Test protected routes
6. ✅ Deploy to production

## Support

For issues with:
- **JWT**: Check token expiration and secrets
- **Database**: Check Prisma migrations
- **Frontend**: Check API proxy routes
- **Backend**: Check middleware and routes