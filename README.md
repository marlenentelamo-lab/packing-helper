## Packing Helper

Packing Helper is a web application that helps people organise packing for a move or a trip. Users can create moves and trips, set dates with countdowns, manage packing tasks, and organise photos into folders. 


## The Problem it Solves
Packing Helper makes preparing for a move or trip easier by bringing important dates, packing tasks, reminders, and photos together in one place. 


## Features

- Move and trip countdowns.
- Tasks with due dates and completion status.
- Picture folders and picture uploads.
- Mark tasks, moves, and trips as completed.
- Move and trip cards with their related tasks and pictures.
- Cards for past moves and trips.
- Separate picture-folder cards.
- Different badge colours for moves and trips.
- Notifications organised into Unread, Tasks, Moves & Trips, and All sections.
- Different notification colours for tasks and moves/trips.


## Technologies Used

| Area | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js and Express.js |
| Database | PostgreSQL |
| Image storage | Cloudinary |
| Frontend hosting | Vercel |
| Backend and database hosting | Render |
| Version control | Github |


## Project Structures
```text
packing-helper/
├── frontend/
│   ├── public/
│   └── src/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── scripts/
│   ├── test/
│   └── server.js
├── .gitignore
└── README.md
```


# Getting Started

Prerequisites
Node.js v18 or later
PostgreSQL v18 or later
Cloudinary account for image uploads



# Clone the repository 
```
git clone https://github.com/marlenentelamo-lab/packing-helper.git
cd packing-helper
```

# Create a PostgreSQL database named packing-helper:
CREATE DATABASE packing_helper

Database setup note: The migration runner applies incremental changes to the application's existing base tables. It does not create the complete initial application schema. A fresh database must have the base tables created before running the migrations. 


# Configure and start the backend
Open a terminal in the backend directory:
```
cd backend
npm install
```

Create a .env file inside the backend/ and add the required environment variables: 

	PORT=3004
	DATABASE_URL=your_postgresql_connection_string
	FRONTEND_URL=https://localhost:3005
	CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
	CLOUDINARY_API_KEY=your_cloudinary_api_key
	CLOUDINARY_API_SECRET=your_clooudinary_api_secret

Do not commit the .env file or share its secrets.

Once the base database schema is in place, run the migrations:
```
npm run migrate
```

## Start the backend:
```
npm start
```

## Configure and start the frontend
```
cd frontend
npm install
npm start
```

The frontend runs at: http://localhost:3005 

Database Migrations
Database migration files are stored in backend/migrations/. The migration runner is backend/scripts/migrate.js.

Run migrations from the backend/ directory:
```
npm run migrate
```

The runner currently applies:
001_user_scoped_data.sql adds user ownership fields and related indexes. 
Existing records without an owner remain unassigned. 
002_move_trip_completion.sql adds completion status to moves and trips. 

The runner creates and uses public.schema.migrations to track applied migration files. It skips migrations already recorded in that table and runs each new migration in a transaction. A failed migration is rolled back. 

003_password_reset_tokens.sql is present in the migrations folder but is not currently included in the migration runner. 

# API Endpoints
All endpoints below are relative to the backend API base URL. 


# Authentication
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/signup | Register a user |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Log out |


## Tasks
| Method | Endpoints | Purpose |
|---|---|---|
| GET | /api/tasks | Retrieve tasks |
| POST | /api/tasks | Create a task |
| PUT/PATCH | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |



# Moves & Trips
| Method | Endpoints | Purpose |
|---|---|---|
| GET | /api/moves | Retrieve all moves belonging to the logged-in user |
| POST | /api/moves | Create a move | 
| GET | /api/moves/:id | Retrieve an individual move |
| PUT | /api/moves/:id | Update a move |
| DELETE | /api/moves/:id | Delete a move |
| GET | /api/trips | Retrieve all trips belonging to the logged-in user |
| POST | /api/trips | Create a trip |
| GET | /api/trips/:id | Retrieve an individual trip |
| PUT | /api/trips/:id | Update a trip |
| DELETE | /api/trips/:id | Delete a trip |


# Picture folders
| Method | Endpoints | Purpose |
|---|---|---|
| GET | /api/picture-folders | Retrieve folders |
| POST | /api/picture-folders | Create a folder | 
| GET | /api/picture-folders/:id | Retrieve a folder |
| PATCH | /api/picture-folders/:id | Rename or update a folder |
| DELETE | /api/picture-folders/:id | Delete a folder |


# Pictures
| Method | Endpoints | Purpose |
|---|---|---|
| GET | /api/picture-folders/:folderId/pictures | Retrieve folder pictures |
| POST | /api/picture-folders/:folderId/pictures | Upload a picture |
| DELETE | /api/pictures/:id | Delete a picture |


# Notifications
| Method | Endpoints | Purpose |
|---|---|---|
| GET | /api/notifications | Retrieve notifications |
| PATCH | /api/notifications/:id/read | Mark a notification as read |
| PATCH | /api/notifications/read-all | Mark all notifications as read (optional) | 


# Screenshots

# Sign up page
<img width="1920" height="968" alt="Screenshot 2026-11-10 213417" src="https://github.com/user-attachments/assets/1d755990-77d7-4fed-8777-36e4000e6cd7" />


# Login page
<img width="1920" height="968" alt="Screenshot 2026-11-10 213443" src="https://github.com/user-attachments/assets/bfc1d12b-1161-4a64-9246-97c0670499ef" />


# Dashboard page
<img width="1920" height="981" alt="Screenshot 2026-11-10 213519" src="https://github.com/user-attachments/assets/4f4c76d8-97f0-4a53-9f3c-4e3e721fa1ac" />


# Moves & Trips page
<img width="1920" height="968" alt="Screenshot 2026-11-10 213533" src="https://github.com/user-attachments/assets/77a35584-ef68-4f7b-9d74-f12d29911a13" />
<img width="1920" height="968" alt="Screenshot 2026-11-10 214818" src="https://github.com/user-attachments/assets/4d8e028a-0203-4b66-87c0-d30d956f99aa" />
<img width="1920" height="971" alt="Screenshot 2026-11-10 213541" src="https://github.com/user-attachments/assets/7fbfa424-8386-4734-b782-3a72820600fd" />
<img width="1920" height="974" alt="Screenshot 2026-11-10 213553" src="https://github.com/user-attachments/assets/404b0f09-2b56-4627-973a-8914460b452d" />


# All tasks page
<img width="1920" height="977" alt="Screenshot 2026-11-10 213607" src="https://github.com/user-attachments/assets/993b6342-1018-4e25-9242-e6770c1110a0" />
<img width="1920" height="971" alt="Screenshot 2026-11-10 213612" src="https://github.com/user-attachments/assets/2deb46bc-2e40-4ef6-a61c-cc3f4c28ec9d" />


# Pictures page
<img width="1920" height="968" alt="Screenshot 2026-11-10 213628" src="https://github.com/user-attachments/assets/a3cf7f7e-6fb3-4b32-9fa8-7f9a9c87073b" />
<img width="1920" height="968" alt="Screenshot 2026-11-10 213637" src="https://github.com/user-attachments/assets/5923e1e0-d6af-4e16-bc5d-4e694e5540fa" />


# Notifications page
<img width="1920" height="981" alt="Screenshot 2026-11-10 213654" src="https://github.com/user-attachments/assets/8fe41bf0-4a90-4e30-8616-8fcdcdc30071" />
<img width="1920" height="974" alt="Screenshot 2026-11-10 213659" src="https://github.com/user-attachments/assets/da26b2e1-daba-48ee-9484-d48f1d3f67e7" />
<img width="1920" height="971" alt="Screenshot 2026-11-10 213705" src="https://github.com/user-attachments/assets/5aa27664-999e-47c5-aac0-28f292c8c215" />
<img width="1920" height="964" alt="Screenshot 2026-11-10 213710" src="https://github.com/user-attachments/assets/145e2aab-da86-42ab-b63d-7734918555fc" />


# System Architecture
- Packing Helper uses a client-server architecture:
- Frontend — React.js: Displays the interface, manages application state, and sends requests to the backend.
- Backend — Node.js and Express.js: Provides REST API endpoints, handles registration, login and sessions, processes application logic, and enforces authenticated, user-specific data access.
- Database — PostgreSQL: Stores user accounts, moves, trips, tasks, picture-folder metadata, and notifications.
- Image storage — Cloudinary: Stores uploaded pictures and provides the URLs and public IDs used to retrieve and delete them.


# Data Flow
- The user interacts with the React frontend.
- The frontend sends an HTTP request to the Express backend.
- The backend validates the request and checks authentication where required.
- The backend reads or updates data in PostgreSQL.
- For picture uploads or deletions, the backend also communicates with Cloudinary.
- The backend returns a response, and React updates the interface.

# Hosting and Deployment
- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL
- Image storage: Cloudinary

# Live Demo
- Frontend: https://packing-helper-pi.vercel.app
- Backend: https://packing-helper-backend.onrender.com
- Database: Hosted on Render

# Future Feature
- Forgot-password functionality
- Email sign-up and login
- Profile page to personalise the app more

# Author
Marlene Ntelamo






