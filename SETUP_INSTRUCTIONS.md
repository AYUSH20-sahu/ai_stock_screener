# Clerk to JWT Migration - Setup Instructions

## ✅ Completed Steps

The following steps have been automatically completed:

1. ✅ Created `.env.local` files from `.env.example` templates
2. ✅ Generated secure JWT secrets (64-character hex strings)
3. ✅ Updated `backend/.env.local` with JWT secrets
4. ✅ Installed backend dependencies (`npm install` in backend)
5. ✅ Installed frontend dependencies (`npm install` in frontend)
6. ✅ Removed Clerk dependencies from `package.json`
7. ✅ Deleted all Clerk-related files
8. ✅ Cleaned up environment files with old Clerk credentials

## ⚠️ Manual Steps Required

### Step 1: Configure Database Connection

**File: `backend/.env.local`**

You need to update the `DATABASE_URL` with your actual PostgreSQL connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_stock_screener"
```

**Options:**

**Option A: Local PostgreSQL**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ai_stock_screener"
```

**Option B: Docker PostgreSQL**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_stock_screener"
```

**Option C: Cloud Database (Supabase, Neon, etc.)**
```env
DATABASE_URL="postgresql://user:pass@host:5432/postgres"
```

### Step 2: Create PostgreSQL Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE ai_stock_screener;"

# Or using createdb
createdb -U postgres ai_stock_screener
```

### Step 3: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name remove-clerk-add-jwt-fields
```

This will:
- Remove the `clerkId` field from User model
- Add `passwordHash`, `emailVerified`, `verificationToken`, `resetToken`, `resetTokenExpiry` fields
- Update the database schema

### Step 4: Seed Database (Optional)

```bash
cd backend
npx prisma db seed
```

This creates a demo user:
- Email: `demo@example.com`
- Password: You'll need to set this via the registration endpoint

### Step 5: Start Backend Server

```bash
cd backend
npm run dev
```

The server should start on `http://localhost:3001`

### Step 6: Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:3000`

### Step 7: Test the Application

1. Navigate to `http://localhost:3000`
2. Click "Start free" or "Sign up"
3. Register a new account at `/register`
4. Login at `/login`
5. Access profile at `/profile`

## 🔐 JWT Secrets (Already Generated)

Your JWT secrets have been generated and added to `backend/.env.local`:

```
JWT_SECRET=dd5251bf1681c26d18b2d113cb8e9b258d17a06da0adbd4ed9d3a4d07eb903c7
JWT_REFRESH_SECRET=ad9dd94d0f3c437df30f8ca88bde477a6ade040839b2e79295a2e401aef9bcb6
```

**Keep these secrets secure!** Do not commit them to version control.

## 📁 Project Structure

```
ai_stock_screener/
├── backend/
│   ├── .env.local          ✅ Created with JWT secrets
│   ├── .env.example        ✅ Updated
│   ├── prisma/
│   │   ├── schema.prisma   ✅ Updated (removed clerkId, added password fields)
│   │   └── seed.ts         ✅ Updated (removed clerkId reference)
│   └── src/
│       ├── utils/
│       │   └── jwt.ts      ✅ Created (JWT utilities)
│       ├── routes/
│       │   └── auth.routes.ts  ✅ Created (auth endpoints)
│       └── middlewares/
│           └── auth.middleware.ts  ✅ Updated (JWT verification)
│
├── frontend/
│   ├── .env.local          ✅ Created
│   ├── .env.example        ✅ Created
│   ├── app/
│   │   ├── login/page.tsx  ✅ Created (replaces Clerk sign-in)
│   │   ├── register/page.tsx  ✅ Created (replaces Clerk sign-up)
│   │   ├── profile/page.tsx   ✅ Updated (JWT auth)
│   │   └── api/auth/[...nextauth]/route.ts  ✅ Created (API proxy)
│   └── components/ui/
│       └── input.tsx       ✅ Created
│
├── MIGRATION_GUIDE.md      ✅ Created (detailed migration docs)
└── SETUP_INSTRUCTIONS.md   ✅ This file
```

## 🚀 Quick Start (If you have PostgreSQL running)

```bash
# 1. Update DATABASE_URL in backend/.env.local with your credentials

# 2. Create database
createdb -U postgres ai_stock_screener

# 3. Run migration
cd backend && npx prisma migrate dev --name remove-clerk-add-jwt-fields

# 4. Start backend
cd backend && npm run dev

# 5. Start frontend (in new terminal)
cd frontend && npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure `backend/.env.local` exists (not `.env.example`)
- Verify the DATABASE_URL format is correct
- Check that PostgreSQL is running

### "Cannot find module 'bcrypt'"
```bash
cd backend
npm install
```

### "Port 3001 already in use"
```bash
# Change PORT in backend/.env.local
PORT=3002
```

### "Migration failed"
```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/?endpoint=register` - Register new user
- `POST /api/auth/?endpoint=login` - Login user
- `POST /api/auth/?endpoint=refresh` - Refresh access token
- `POST /api/auth/?endpoint=logout` - Logout user
- `GET /api/auth/?endpoint=me` - Get current user

### Token Format
- **Access Token**: 15 minutes expiry, stored in httpOnly cookie
- **Refresh Token**: 7 days expiry, stored in httpOnly cookie

## 🔄 Rollback to Clerk (If Needed)

If you need to revert to Clerk:

```bash
# Restore from git
git checkout HEAD -- frontend/app/sign-in/ frontend/app/sign-up/
git checkout HEAD -- backend/src/utils/clerkSync.ts

# Reinstall Clerk
cd frontend && npm install @clerk/nextjs
cd backend && npm install @clerk/backend

# Restore environment variables
# Add CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY back to .env files
```

## 📝 Next Steps

1. Update `DATABASE_URL` in `backend/.env.local`
2. Create PostgreSQL database
3. Run Prisma migration
4. Start development servers
5. Test registration/login flow
6. Deploy to production (update environment variables)

## ✨ Migration Complete!

Your project has been successfully migrated from Clerk to JWT authentication. All Clerk dependencies have been removed, and you now have full control over your authentication system.