# 🚭 Smoking Cessation Support Platform

A comprehensive digital platform designed to empower users to quit smoking through personalized plans, real-time progress tracking, professional coaching, and a supportive community environment.

---

## ✨ Features

- 🔐 **User Registration & Authentication:** Secure sign-up and login using JWT (JSON Web Token) for session management and role-based access.
- 📊 **Smoking Status Tracking & Analytics:** Log daily smoking habits, visualize progress, and receive data-driven insights to support quitting efforts.
- 📅 **Personalized Quit Plans:** Tailored cessation plans with milestone goals, daily tasks, and adaptive recommendations based on user progress.
- 🏅 **Achievement Badges & Progress Visualization:** Earn badges for reaching milestones and view progress through interactive charts and dashboards.
- 💬 **Community Discussion & Peer Support:** Join forums, participate in group discussions, and connect with others on the same journey.
- 🧑‍⚕️ **Coach Dashboard & Consultation Management:** Coaches can monitor member progress, provide personalized advice, and manage consultation sessions.
- 🔔 **Scheduled Reminders & Motivational Tips:** Receive timely notifications, reminders, and motivational messages to stay on track.
- ❤️ **Health Improvement & Money Saved Tracker:** Track health benefits gained and money saved since quitting, with real-time updates.
- 📈 **Comprehensive Reports:** Generate detailed reports on user activity, plan effectiveness, and overall platform performance (admin only).
- 🛡️ **Security & Data Protection:** Robust input validation, protection against SQL injection and XSS, and secure error handling.
- 🖼️ **Modern Responsive UI:** Intuitive, mobile-friendly interface built with Ant Design and React.js.

---

## 🧱 Tech Stack

- **Frontend:** React.js, Ant Design, Axios
- **Backend:** Node.js, Express.js
- **Database:** SQL Server
- **Authentication:** JWT (JSON Web Token)
- **Other:** XLSX for report exports, Multer for file uploads

---

## 📁 Project Structure

```
smoking-cessation-platform/
├── client/           # React frontend (UI, components, pages)
├── server/           # Express backend (API, routes, controllers)
├── database/         # SQL Server scripts, migrations, seeders
├── docs/             # Project documentation, API specs
└── README.md         # Project overview and instructions
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- SQL Server (2017+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Nyanko-meow/Smoke-DEMO
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
# Copy environment variable templates and configure them
cp .env.example .env
# Edit .env files in both /server and /client with your settings
```

### Database Setup

- Create a new SQL Server database (e.g., `SMOKEKING`).
- Run the migration scripts in `/database` to set up tables and seed initial data.
- Update your `/server/.env` with the correct database connection details.

### Running Development Servers

```bash
# Start the backend server
cd server
npm run dev

# Start the frontend development server
cd ../client
npm start
```

- The backend will typically run on `http://localhost:4000`
- The frontend will run on `http://localhost:3000`

---

## 👥 User Roles & Permissions

- **Guest:** Can browse public pages, view information, and register for an account.
- **Member:** Can log daily smoking status, follow personalized quit plans, join community discussions, and track achievements.
- **Coach:** Can view and support assigned members, provide guidance, manage consultations, and monitor member progress.
- **Admin:** Has full access to all system features, including user management, content moderation, reporting, and platform configuration.

---

## 📦 API Overview

- **Authentication:** `/api/auth/register`, `/api/auth/login`
- **User Management:** `/api/users`, `/api/users/:id`
- **Quit Plans:** `/api/plans`, `/api/plans/:id`
- **Progress Tracking:** `/api/progress`, `/api/progress/:userId`
- **Achievements:** `/api/achievements`
- **Community:** `/api/community/posts`, `/api/community/comments`
- **Coach Tools:** `/api/coach/dashboard`, `/api/coach/consultations`
- **Admin Tools:** `/api/admin/reports`, `/api/admin/users`, `/api/admin/plans`

*See `/docs/api.md` for full API documentation.*

---

## 🛡️ Security & Best Practices

- All sensitive routes are protected by JWT authentication middleware.
- Role-based access control ensures users can only access permitted resources.
- Input validation and sanitization on all endpoints.
- Protection against common web vulnerabilities (SQL injection, XSS, CSRF).
- Secure error handling and logging.

---

## 🖥️ UI & UX

- Built with React.js and Ant Design for a modern, responsive experience.
- Supports both desktop and mobile devices.
- Accessible design with clear navigation and helpful tooltips.
- Real-time feedback and notifications for user actions.

---

## 📝 License

```
MIT License

Copyright (c) 2025 SWP391 - Group 7

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
```

---

## 📞 Support & Contact

For questions, bug reports, or feature requests, please open an issue on the [GitHub repository](https://github.com/Nyanko-meow/Smoke-DEMO) or contact the project maintainers.

---

## 📝 Changelog

See `CHANGELOG.md` for release history and update notes.

---

**© 2025 SWP391 - Group 7. All rights reserved.**
