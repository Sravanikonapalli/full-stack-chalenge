### Full-Stack Store Rating App
This is a full-stack web application built with React (frontend), Express (backend), and SQLite (database). It supports role-based authentication and allows users to rate stores, while administrators and store owners have access to role-specific dashboards.

-----------------------------------------------------
## Features
-- Authentication
-- Signup and login functionality
-- JWT-based authentication
-- Role-based access: systemadmin, storeowner, and normaluser
-- Signup form includes address and role selection

-----------------------
## Roles & Dashboards
*System Administrator*
View all users
Create new users
View all stores

*Store Owner*
View only their own stores
View ratings for their stores along with user information

*Normal User*
View all stores

----------------------------
## Tech Stack
Frontend: React

Backend: Express.js, JWT, bcrypt.js

Database: SQLite

----------------------------
## Setup Instructions
1. Clone the Repository
```
git clone https://github.com/Sravanikonapalli/full-stack-chalenge.git
cd store-rating-app
```
2. Backend Setup
```
cd backend
npm install
node server.js
```
The server will start on http://localhost:3001 and automatically create the SQLite database with required tables.

3. Frontend Setup
```
cd frontend
npm install
npm start
```

----------------------------
## deployment

*backend* - render
*frontend* - vercel
