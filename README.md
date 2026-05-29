# Task Manager Web App

**Author:** Elio Ishak  
**Project:** Task Manager  
**Stack:** React, Vite, Node.js, Express, TypeScript, PostgreSQL, Kysely

Task Manager is a full-stack web application for creating, assigning, and tracking personal and organization tasks. The frontend is a React/Vite app, the backend is an Express API, and PostgreSQL runs through Docker.

## Project Structure

```text
.
+-- client/                 # React + Vite web app
+-- server/                 # Express + TypeScript API
+-- docker-compose.yml      # PostgreSQL and Adminer services
+-- .env                    # Shared local environment variables
+-- README.md
```

## Features

- User signup and login
- JWT-based authentication
- Persistent sessions in the browser
- Personal task creation, editing, completion, and deletion
- Organization accounts that can create organization tasks
- Member accounts that can join organizations
- Members can take available organization tasks
- Profile updates and account deletion
- PostgreSQL-backed data storage

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- lucide-react icons

### Backend

- Node.js
- Express
- TypeScript
- Kysely
- PostgreSQL
- bcrypt
- jose JWTs

### Infrastructure

- Docker Compose
- PostgreSQL 16
- Adminer

## Environment Variables

Create a `.env` file in the project root:

```env
POSTGRES_DB=task_manager
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin12345
POSTGRES_PORT=5432
ADMINER_PORT=8080

DATABASE_URL=postgres://admin:admin12345@localhost:5432/task_manager
JWT_SECRET=SECRET
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

The backend loads this root `.env` file when it is started from the `server/` directory.

## Setup

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Start PostgreSQL and Adminer from the project root:

```bash
docker compose up -d
```

Apply the database migration from the project root.

PowerShell:

```powershell
Get-Content server\src\db\migrations\001_init.sql | docker exec -i taskmanager-postgres psql -U admin -d task_manager
Get-Content server\src\db\migrations\002_expand_user_name.sql | docker exec -i taskmanager-postgres psql -U admin -d task_manager
```

Bash:

```bash
docker exec -i taskmanager-postgres psql -U admin -d task_manager < server/src/db/migrations/001_init.sql
docker exec -i taskmanager-postgres psql -U admin -d task_manager < server/src/db/migrations/002_expand_user_name.sql
```

## Running Locally

Start the API:

```bash
cd server
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

Start the web app:

```bash
cd client
npm run dev
```

The client runs at:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so the frontend can call the backend using relative `/api/...` URLs.

## Useful URLs

- Web app: `http://localhost:5174`
- API base URL: `http://localhost:3000/api`
- Adminer: `http://localhost:8090`

Adminer connection values:

```text
System: PostgreSQL
Server: postgres
Username: admin
Password: admin12345
Database: task_manager
```

## API Overview

The client uses these backend route groups:

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `PATCH /api/users/me/organization`
- `GET /api/users/organizations`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `PATCH /api/tasks/:id/complete`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/organization`
- `POST /api/tasks/organization`
- `GET /api/tasks/organization/available`
- `PATCH /api/tasks/organization/:id/take`

Protected routes require an `Authorization: Bearer <token>` header. The frontend stores the token locally after login/signup and sends it automatically.

## Build

Build the backend:

```bash
cd server
npm run build
```

Build the frontend:

```bash
cd client
npm run build
```

## Database Notes

PostgreSQL credentials are initialized the first time Docker creates the `postgres_data` volume. If you later change `POSTGRES_USER` or `POSTGRES_PASSWORD` in `.env`, the existing database volume will still keep the old credentials.

If local login fails with a password authentication error and you do not need the existing local data, recreate the database volume:

```bash
docker compose down -v
docker compose up -d
```

Then apply the migration again.
