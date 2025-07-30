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
- SQL Server
- npm or yarn

### Installation

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
