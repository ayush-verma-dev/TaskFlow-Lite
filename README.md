# TaskFlow Lite — Full-Stack Task Management App

TaskFlow Lite is a full-stack task management web application that helps users organize their work, prioritize tasks, set due dates, and track progress through a clean, responsive dashboard.

**Live Demo:** https://task-flow-lite-tau.vercel.app  
**Backend API:** https://taskflow-lite-api.onrender.com  
**GitHub Repository:** https://github.com/ayush-verma-dev/TaskFlow-Lite

## Features

### Authentication and Security
- User registration and login
- Password hashing with bcrypt
- JWT-based authentication using HTTP-only cookies
- Session persistence across page refreshes
- Logout functionality
- Protected API routes

### Task Management
- Create, view, edit, and delete tasks
- Add task titles and descriptions
- Set task status:
  - Pending
  - In Progress
  - Completed
- Set task priority:
  - Low
  - Medium
  - High
- Assign due dates to tasks
- Keep each user's tasks private

### Dashboard and Productivity
- View total tasks
- Track pending, in-progress, and completed tasks
- Identify overdue tasks
- Search tasks
- Filter tasks by status and priority
- Combine filters and clear them when needed
- Responsive user interface

## Technology Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB Atlas
- Mongoose

**Authentication and Security**
- JSON Web Tokens (JWT)
- bcryptjs
- HTTP-only cookies
- CORS

**Tools and Deployment**
- Git and GitHub
- Postman
- Vercel — frontend hosting
- Render — backend hosting

## Architecture

The frontend communicates with the Express REST API. The backend authenticates users, validates requests, and uses Mongoose to store and retrieve user and task data from MongoDB Atlas.

```text
React + Vite Frontend
        |
        | HTTP requests with credentials
        v
Express.js REST API
        |
        | JWT authentication
        v
Authentication Middleware
        |
        v
MongoDB Atlas
   |          |
 Users       Tasks
```

## Local Installation

### Prerequisites
- Node.js and npm
- A MongoDB Atlas account or MongoDB instance
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ayush-verma-dev/TaskFlow-Lite.git
cd TaskFlow-Lite
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Replace the MongoDB URI and JWT secret with your own values. Never commit real credentials or secret keys to GitHub.

Start the backend:

```bash
npm run dev
```

The API should be available at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## API Endpoints

Base URL: `https://taskflow-lite-api.onrender.com`

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a user | No |
| POST | `/api/auth/login` | Log in | No |
| POST | `/api/auth/logout` | Log out | Uses authentication cookie |
| GET | `/api/auth/me` | Get current user | Yes |

### Tasks

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/tasks` | Create a task | Yes |
| GET | `/api/tasks` | Get the current user's tasks | Yes |
| PATCH | `/api/tasks/:id` | Update a task | Yes |
| DELETE | `/api/tasks/:id` | Delete a task | Yes |

Authentication uses an HTTP-only cookie. When calling the API from a browser, requests must include credentials.

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | Server port; hosting platforms may provide their own |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `NODE_ENV` | Runtime environment |
| `FRONTEND_URL` | Allowed frontend origin for CORS |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

Only public configuration should be placed in frontend environment variables. Never expose database credentials or JWT secrets in frontend code.

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Live application: https://task-flow-lite-tau.vercel.app

Note: Render's free instances may spin down when inactive, causing a delay on the first request.

## What I Learned

- Building a full-stack application with React and Express
- Designing REST API endpoints
- Implementing registration, login, logout, and JWT authentication
- Protecting routes and associating tasks with authenticated users
- Working with MongoDB Atlas and Mongoose
- Handling CORS and credentialed browser requests
- Managing environment variables
- Deploying a full-stack application using Vercel and Render
- Using Git and GitHub to manage project versions

## Future Improvements

- Task pagination and sorting
- Task reminders and notifications
- Automated testing
- Improved accessibility
- More detailed task analytics

## Author

**Ayush Verma**

- GitHub: https://github.com/ayush-verma-dev

---

If you find this project useful, consider giving the repository a star.
