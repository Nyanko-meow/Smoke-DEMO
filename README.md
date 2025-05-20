# Smoking Cessation Support Platform

A comprehensive platform to help users quit smoking through personalized plans, tracking, and community support.

## Features

- User registration and membership management
- Smoking status tracking and progress monitoring
- Personalized quit smoking plans
- Achievement badges and progress tracking
- Community support and sharing
- Professional coaching support
- Regular notifications and reminders
- Health improvement tracking
- Money saved calculator

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: SQL Server
- Authentication: JWT

## Project Structure

```
smoking-cessation-platform/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── database/              # Database scripts and migrations
└── docs/                  # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- SQL Server
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the variables with your configuration

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## User Roles

1. Guest
   - View public information
   - Access blog posts
   - View testimonials
   - Register as a member

2. Member
   - Track smoking habits
   - Create quit plans
   - View progress
   - Earn achievements
   - Participate in community
   - Access basic features

3. Coach
   - Provide professional guidance
   - Monitor member progress
   - Create content
   - Manage consultations

4. Admin
   - Manage users
   - Configure system settings
   - Generate reports
   - Manage content
   - Handle payments

## License

MIT 