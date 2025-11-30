# Time Management and Task Prioritization System

A full-stack web application for managing tasks, prioritizing them based on deadlines and importance, and tracking time spent on each task.

## Features

### Admin Features

- Configure prioritization rules (deadline weight, importance weight, importance levels)
- Manage task categories
- Monitor system performance with metrics and charts

### User Features

- Set task priorities with deadlines and importance levels
- Track time spent on tasks
- Review task progress and statistics

## Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## Installation

1. Install dependencies:

```bash
npm install
```

2. Make sure MongoDB is running on your system (default: `mongodb://localhost:27017`)

3. Create a `.env` file (optional, defaults are set):

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your-secret-key-change-this-in-production
```

4. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login. You can register as either a user or admin.

2. **Admin Dashboard**:

   - Configure prioritization rules
   - Create and manage task categories
   - View system performance metrics

3. **User Dashboard**:
   - Create tasks with deadlines and importance levels
   - Start/stop time tracking for tasks
   - View progress and statistics

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user.
- `POST /api/auth/login` - Login user.

### Admin Routes (require admin role)

- `GET /api/admin/prioritization-rules` - Get prioritization rules
- `POST /api/admin/prioritization-rules` - Configure prioritization rules
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/performance` - Get system performance metrics

### User Routes

- `GET /api/user/tasks` - Get user's tasks
- `POST /api/user/tasks` - Create task
- `PUT /api/user/tasks/:id` - Update task
- `DELETE /api/user/tasks/:id` - Delete task
- `POST /api/user/time-logs` - Start time tracking
- `GET /api/user/time-logs` - Get time logs
- `PUT /api/user/time-logs/:id/stop` - Stop time tracking
- `GET /api/user/progress` - Get progress summary
- `GET /api/user/categories` - Get categories

## Project Structure

```
task manager/
├── models/          # MongoDB models
├── routes/          # API routes
├── middleware/      # Authentication middleware
├── public/          # Frontend files (HTML, JS, CSS)
├── server.js        # Express server
└── package.json     # Dependencies
```
