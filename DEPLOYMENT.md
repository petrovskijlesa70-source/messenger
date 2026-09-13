# Deployment Guide

## Backend Deployment (Railway/Render)

### Option 1: Railway

1. **Create Railway Account**
   - Go to https://railway.app/
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL Database**
   - In your project, click "+ New Service"
   - Select "PostgreSQL"
   - Railway will create a database instance

4. **Configure Environment Variables**
   - Go to your project settings
   - Add the following variables:
   
   ```
   DATABASE_URL = (from Railway PostgreSQL - click on database → "Connection URL")
   JWT_SECRET = (generate a random string, e.g., using: openssl rand -base64 32)
   CLIENT_URL = (your deployed frontend URL, e.g., https://your-app.vercel.app)
   PORT = 3001
   NODE_ENV = production
   ```

5. **Run Database Migrations**
   - Railway will automatically run `npx prisma migrate deploy` on deploy
   - Or manually run in Railway console:
   ```bash
   npx prisma migrate deploy
   ```

6. **Deploy**
   - Railway will auto-deploy on push to GitHub
   - Your backend URL will be: `https://your-project.railway.app`

### Option 2: Render

1. **Create Render Account**
   - Go to https://render.com/
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New +"
   - Select "PostgreSQL"
   - Name it: `messenger-db`
   - Create

3. **Create Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repo
   - Root directory: `server`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm start`

4. **Configure Environment Variables**
   - In your web service settings, add:
   
   ```
   DATABASE_URL = (from Render PostgreSQL - Internal Database URL)
   JWT_SECRET = (generate random string)
   CLIENT_URL = (your frontend URL)
   PORT = 3001
   NODE_ENV = production
   ```

5. **Run Migrations**
   - Add a "Deploy Hook" or run manually in Render shell:
   ```bash
   npx prisma migrate deploy
   ```

## Frontend Deployment (Vercel/Netlify)

### Option 1: Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com/
   - Sign up with GitHub

2. **Deploy**
   - Click "Add New Project"
   - Select your repository
   - Root directory: `client`
   - Framework Preset: Vite

3. **Configure Environment Variables**
   - Add these in Vercel project settings:
   
   ```
   VITE_API_URL = (your backend URL, e.g., https://your-backend.railway.app/api)
   VITE_SOCKET_URL = (your backend URL, e.g., https://your-backend.railway.app)
   ```

4. **Deploy**
   - Click "Deploy"
   - Your frontend URL will be: `https://your-app.vercel.app`

### Option 2: Netlify

1. **Create Netlify Account**
   - Go to https://netlify.com/
   - Sign up

2. **Build Locally**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy**
   - In Netlify dashboard, click "Add new site"
   - Drag and drop the `client/dist` folder
   - Or connect to GitHub for auto-deploys

4. **Configure Environment Variables**
   - In Site settings → Build & deploy → Environment:
   
   ```
   VITE_API_URL = (your backend URL)
   VITE_SOCKET_URL = (your backend URL)
   ```

## Important Notes

### CORS Configuration
Make sure your backend's `CLIENT_URL` environment variable matches your deployed frontend URL exactly.

### Database URL
For production, use the managed PostgreSQL connection string provided by Railway/Render. Never use local database URLs in production.

### JWT Secret
Generate a secure random string for JWT_SECRET in production:
```bash
openssl rand -base64 32
```

### WebSocket Support
Both Railway and Render support WebSockets. No additional configuration needed.

### Testing Production
1. Deploy both frontend and backend
2. Update environment variables
3. Test registration from two different browsers/devices
4. Verify real-time messaging works

## Troubleshooting

**WebSocket Connection Failed:**
- Check backend is running
- Verify SOCKET_URL is correct (no /api suffix)
- Check CORS settings

**Database Connection Error:**
- Verify DATABASE_URL is correct
- Check database is running
- Ensure migrations ran successfully

**Build Errors:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors
