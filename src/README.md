# Video Sharing Project

## Project overview
This project is a full-stack video sharing platform with JWT auth, file uploads, MongoDB persistence, and a React frontend.

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Auth: JWT with refresh token rotation
- Password hashing: bcrypt
- Uploads: Multer + Cloudinary

## Repository structure
```text
BackendProject/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── docs/
│   └── data-model.md
├── .gitignore
├── README.md
└── .env.example
```

## Environment setup
1. Copy the sample env file:
   ```bash
   cp .env.example backend/.env
   ```
2. Fill in the required values for MongoDB, Cloudinary, and JWT secrets.
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Run the backend:
   ```bash
   cd backend && npm run dev
   ```
5. Run the frontend:
   ```bash
   cd frontend && npm run dev
   ```

## Data model overview
Collections:
- User
- Video
- Comment
- Like
- Subscription
- Playlist
- WatchHistory

Relationship plan:
- User -> Video: referenced by `owner` on Video
- Video -> Comment: referenced by `video` on Comment
- Video -> Like: referenced by `video` on Like
- User -> Like: referenced by `likedBy` on Like
- User -> Subscription: referenced by `subscriber` and `channel`
- User -> Playlist: referenced by `owner` on Playlist
- User -> WatchHistory: referenced by `watchHistory` array on User

Why referenced instead of embedded:
- User and video records can grow independently
- updates to likes, subscriptions and watch history do not require rewriting parent documents
- queries remain efficient and scalable for a feed and channel view

Counters and denormalisation plan:
- likesCount, views, subscribersCount should be stored on the parent document and updated via single-document mutation after writes
- the source of truth remains the child collections, with periodic reconciliation jobs when needed

Audit fields:
- `createdAt`, `updatedAt` on all schemas
- `isDeleted` + `deletedAt` used as soft deletes, never a hard delete

## Schema diagram
```text
User
  ├─ 1:n Video (owner)
  ├─ 1:n Comment (owner)
  ├─ 1:n Like (likedBy)
  ├─ 1:n Subscription (subscriber)
  ├─ 1:n Subscription (channel)
  ├─ 1:n Playlist (owner)
  └─ 1:n WatchHistory (watchHistory[])

Video
  ├─ 1:n Comment (video)
  ├─ 1:n Like (video)
  └─ 1:n WatchHistory (video)
```

## Indexes and query strategy
- `Video`: compound index `{ owner, createdAt }`
- `Video`: text index on title + description
- `Like`: unique compound index `{ likedBy, video }`
- `Subscription`: unique compound index `{ subscriber, channel }`
- TTL index for abandoned upload state should be added when upload jobs or temp storage metadata are introduced

## Auth notes
- access tokens: 15 minutes
- refresh tokens: 7 days
- refresh tokens rotated on use
- cookies: `httpOnly`, `secure`, `sameSite=lax` in local dev and `none` in production if needed
- bcrypt cost factor: 12
- roles: `viewer`, `creator`, `admin`

## Notes for contributors
- Keep one route per resource under `backend/src/routes`
- Keep business logic in `backend/src/controllers`
- Keep reusable logic in `backend/src/services` and `backend/src/utils`
- Never commit a real `.env` file

