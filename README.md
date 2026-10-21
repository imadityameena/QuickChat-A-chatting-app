# QuickChat

A real-time one-to-one chat app: React + Vite + Tailwind on the frontend, Express + Socket.io + MongoDB on the backend, Cloudinary for images.

## Features

- Sign up / log in (JWT, 7-day sessions)
- Real-time messages, online status and typing indicator
- Unread counts, last-message previews, conversations sorted by recent activity
- "Sent" / "Seen" status on your latest message
- Image messages and profile pictures (up to 5MB)
- Works across multiple tabs and devices

## Running locally

```bash
# backend
cd backend
cp .env.example .env   # fill in MongoDB, JWT secret and Cloudinary keys
npm install
npm run server         # http://localhost:5000

# frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## Deployment note

Socket.io needs a long-running server. Vercel's serverless functions can't hold WebSocket connections, so deploy the backend on a host such as Render, Railway or Fly.io for real-time features to work. The frontend can stay on Vercel.
