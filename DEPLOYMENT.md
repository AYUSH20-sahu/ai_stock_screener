# Deployment Guide

## Backend (Render)

1. Push code to GitHub
2. Connect repository to Render
3. Create new Web Service with:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Runtime: Node
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `FRONTEND_URL=https://ai-stock-screener.vercel.app`
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `YAHOO_FINANCE_API_KEY`
5. Deploy

## Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Configure:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://ai-stock-screener-backend.onrender.com/api`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Deploy

## CORS Configuration

Backend CORS is configured to allow requests from:
- Development: `http://localhost:3000`, `http://127.0.0.1:3000`
- Production: `https://ai-stock-screener.vercel.app` (configurable via `FRONTEND_URL`)

## Environment Variables

See `.env.example` files in both `frontend/` and `backend/` directories for required variables.