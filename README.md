# Messenger MVP

Working real-time messenger built with React, Node.js, Express, PostgreSQL, and Socket.IO.

## Tech Stack

**Frontend:**
- React
- TypeScript
- Vite
- Socket.IO Client
- React Router
- TailwindCSS

**Backend:**
- Node.js
- TypeScript
- Express
- Socket.IO
- Prisma ORM
- PostgreSQL
- bcryptjs
- jsonwebtoken

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v14 or higher)
   - Download from https://www.postgresql.org/download/
   - Or use a cloud service (Railway, Render, Neon, etc.)

## Installation

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Setup PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Create database
createdb messenger

# Or using psql
psql -U postgres
CREATE DATABASE messenger;
\q
```

**Option B: Cloud PostgreSQL (Recommended for Production)**

- Railway: https://railway.app/
- Render: https://render.com/
- Neon: https://neon.tech/

Create a PostgreSQL instance and copy the connection string.

### 3. Configure Environment Variables

```bash
# Copy example env file
cd server
cp .env.example .env

# Edit .env with your values
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secret string for JWT tokens
- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - Frontend URL (default: http://localhost:5173)

Example:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/messenger?schema=public"
JWT_SECRET="change-this-to-random-string-in-production"
PORT=3001
CLIENT_URL="http://localhost:5173"
```

### 4. Run Database Migrations

```bash
cd server
npx prisma migrate dev --name init
```

This will create all required tables:
- users
- chats
- chat_members
- messages

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Backend runs on: http://localhost:3001
Frontend runs on: http://localhost:5173

## Testing the MVP

### 1. Register First User
- Open http://localhost:5173
- Click "Register"
- Enter username: `@alex123`
- Enter display name: `Alex`
- Enter password: `password123`
- Submit

### 2. Register Second User (Incognito Window)
- Open incognito window
- Go to http://localhost:5173
- Register with different username: `@john456`
- Display name: `John`
- Password: `password123`

### 3. Test Chat Between Users
- In first window, search for `@john456`
- Click "Написать" (Write)
- Send message: "Привет!"
- In second window, message should appear instantly
- Reply from second window: "Привет, как дела?"
- Message appears in first window instantly

### 4. Test Persistence
- Refresh both pages
- Chat history should remain
- Logout and login again
- History still there

## Database Schema

### Users Table
- id (UUID, Primary Key)
- username (String, Unique)
- display_name (String)
- password_hash (String)
- avatar_url (String, Optional)
- created_at (DateTime)
- last_seen (DateTime)

### Chats Table
- id (UUID, Primary Key)
- type (Enum: DIRECT)
- created_at (DateTime)

### Chat Members Table
- chat_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- Unique constraint on (chat_id, user_id)

### Messages Table
- id (UUID, Primary Key)
- chat_id (UUID, Foreign Key)
- sender_id (UUID, Foreign Key)
- text (String)
- created_at (DateTime)

## Deployment

### Frontend Deployment (Vercel/Netlify)

**Vercel:**
```bash
cd client
npm install -g vercel
vercel
```

**Netlify:**
```bash
cd client
npm run build
# Upload dist/ folder to Netlify
```

### Backend Deployment (Railway/Render)

**Railway:**
1. Create Railway account
2. New Project → GitHub → Connect your repo
3. Add PostgreSQL database
4. Set environment variables:
   - `DATABASE_URL` (from Railway PostgreSQL)
   - `JWT_SECRET` (generate random string)
   - `CLIENT_URL` (your deployed frontend URL)
   - `PORT` (default: 3001)
5. Deploy: Railway will auto-deploy on push
6. Run migration: `npx prisma migrate deploy`

**Render:**
1. Create Render account
2. New Web Service → Connect GitHub repo
3. Set environment variables (same as above)
4. Add PostgreSQL database
5. Deploy

### Production Environment Variables

Add these to your hosting platform:

```
DATABASE_URL="your-production-postgresql-url"
JWT_SECRET="long-random-secret-string"
CLIENT_URL="https://your-frontend-domain.com"
PORT=3001
NODE_ENV=production
```

## Project Structure

```
messenger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities (socket, api)
│   │   └── types/          # TypeScript types
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── socket/         # Socket.IO logic
│   │   ├── prisma/         # Prisma client
│   │   └── index.ts        # Server entry
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── .gitignore
├── .env.example
└── README.md
```

## Security Notes

- Passwords are hashed with bcryptjs (never stored in plain text)
- JWT tokens for authentication
- Input validation on both frontend and backend
- CORS configured for allowed origins
- SQL injection prevention via Prisma ORM
- WebSocket authentication via JWT

## Troubleshooting

**Database connection error:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Ensure database exists

**CORS error:**
- Check CLIENT_URL matches your frontend URL
- In production, use your deployed domain

**Socket not connecting:**
- Check backend is running
- Verify WebSocket port
- Check browser console for errors

**Migration fails:**
- Drop database and recreate: `DROP DATABASE messenger; CREATE DATABASE messenger;`
- Run migration again: `npx prisma migrate dev --name init`

## Future Enhancements

- File upload (S3-compatible storage)
- Push notifications
- Voice/video calls
- Group chats
- Message reactions
- Read receipts
- Typing indicators
