<<<<<<< HEAD
# 🚭 Smoking Cessation Support Platform

A comprehensive platform designed to help users quit smoking through personalized plans, real-time tracking, professional coaching, and community engagement.

## ✨ Features

- 🔐 User registration & authentication (JWT)
- 📊 Smoking status tracking & analytics
- 📅 Personalized quit plans with milestone goals
- 🏅 Achievement badges & progress visualization
- 💬 Community discussion & peer support
- 🧑‍⚕️ Coach dashboard & consultation management
- 🔔 Scheduled reminders & motivational tips
- ❤️ Health improvement & money saved tracker

## 🧱 Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Database:** SQL Server
- **Authentication:** JWT (JSON Web Token)

## 📁 Project Structure

```
smoking-cessation-platform/
├── client/           # React frontend
├── server/           # Express backend
├── database/         # SQL Server scripts & migrations
└── docs/             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
=======
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
>>>>>>> feature/lam-lai-UI-Front-end
- SQL Server
- npm or yarn

### Installation

<<<<<<< HEAD
```bash
# Clone the repo
git clone git@github.com:<your-username>/smoking-cessation-platform.git
cd smoking-cessation-platform

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Setup

```bash
# In both /server and /client folders:
cp .env.example .env
# Then update .env files with your config
```

### Run Development Servers

```bash
# Start backend
cd server
npm run dev

# Start frontend
cd ../client
npm start
```

## 👥 User Roles

- **Guest:** View public pages, register account
- **Member:** Track habits, follow plans, join community
- **Coach:** Support members, provide guidance, manage consultations
- **Admin:** Full system management, reports, user & content control

## 📝 License

Copyright (c) 2025 SWP391 - Nhóm 7

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
=======
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
>>>>>>> feature/lam-lai-UI-Front-end
