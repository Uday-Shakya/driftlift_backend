<div align="center">

# ⚡ DriftLift Backend API

### *Robust REST API Engine for DriftLift Fitness Platform*

High-performance Node.js / Express backend providing secure JWT authentication, biometric tracking persistence, workout routine management, and cloud media processing.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Secure%20Auth-black?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20Uploads-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Overview](#-overview) • [API Endpoints](#-api-endpoints) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Project Structure](#-project-structure)

---

</div>

## 📖 Overview

The **DriftLift Backend** powers data persistence, identity management, and biometric aggregation for the DriftLift ecosystem. It exposes secure REST endpoints with cross-origin cookie authentication, enabling real-time logging for calorie intake, water hydration, sleep quality, step count, weight trends, and workout history.

---

## ⚡ API Endpoints

### 🔐 1. Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user with height, weight, gender, DOB, and goal | No |
| `POST` | `/auth/login` | Authenticate user and issue HTTP-only JWT cookies | No |
| `POST` | `/auth/checklogin` | Verify active session and return user identity | Yes (Cookie) |
| `POST` | `/auth/logout` | Clear session cookies | Yes (Cookie) |
| `GET` | `/auth/getuser` | Fetch complete user biometric profile & stats | Yes (Cookie) |

### 🏋️ 2. Workout Tracking & Plans (`/workouttrack` & `/workoutplans`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/workouttrack/addworkoutentry` | Record completed workout set, reps, and duration | Yes |
| `POST` | `/workouttrack/getworkoutsbydate` | Retrieve workout logs for a specific calendar date | Yes |
| `POST` | `/workouttrack/getworkoutbylimit` | Fetch recent workout logs for 3D Heatmap fatigue sync | Yes |
| `GET` | `/workoutplans/getallworkouts` | Fetch curated workout routines and exercise tutorials | No |
| `GET` | `/workoutplans/getworkoutbyid/:id` | Fetch specific workout routine by ID | No |

### 📊 3. Biometric & Lifestyle Tracking
- **💧 Hydration (`/watertrack`)**:
  - `POST /watertrack/addwaterentry`: Record water intake in milliliters.
  - `POST /watertrack/getwaterbydate`: Retrieve hydration logs for a date.
  - `POST /watertrack/getwaterbylimit`: Fetch historical hydration trend data.
- **🔥 Calories & Nutrition (`/calorieintake`)**:
  - `POST /calorieintake/addcalorieintake`: Log food item, portion, and calories.
  - `POST /calorieintake/getcalorieintakebydate`: Daily caloric intake breakdown.
  - `POST /calorieintake/getcalorieintakebylimit`: Historical calorie trend data.
- **🌙 Sleep Quality (`/sleeptrack`)**:
  - `POST /sleeptrack/addsleepentry`: Log hours of sleep.
  - `POST /sleeptrack/getsleepbylimit`: Fetch sleep trends and recovery metrics.
- **👟 Steps & Mobility (`/steptrack`)**:
  - `POST /steptrack/addstepentry`: Log daily step count.
  - `POST /steptrack/getstepbylimit`: Fetch step progression curves.
- **⚖️ Weight Progression (`/weighttrack`)**:
  - `POST /weighttrack/addweightentry`: Record body weight measurement.
  - `POST /weighttrack/getweightbylimit`: Fetch weight change history.

### 🖼️ 4. Media Uploads & Reports (`/image-upload` & `/report`)
- **Cloudinary + Sharp**: Image optimization and cloud avatar/workout uploads.
- **Automated Reports**: Aggregated health summary generation.

### ⚡ 5. Real-Time Multiplayer Squad Rooms (`ws://` & `/squad`)
- **Native RFC 6455 WebSocket Server** (`ws://localhost:8000/squad-ws`):
  - In-memory squad room session state and member tracking.
  - Sub-10ms synchronized rest countdown intervals with automatic room broadcast.
  - Live set telemetry (`LOG_SET`), member status transitions (`LIFTING`, `RESTING`, `HYDRATING`), and hype reaction emoji bursts (`🔥`, `💪`, `⚡`, `👏`).
- **REST Discovery Endpoints**:
  - `GET /squad/rooms`: List active public squad rooms and roster telemetry.
  - `POST /squad/rooms/create`: Create a custom squad room with specialized workout split.

---

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) (v18+) |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/), [bcrypt](https://www.npmjs.com/package/bcrypt), [cookie-parser](https://www.npmjs.com/package/cookie-parser) |
| **Media Processing** | [Multer](https://github.com/expressjs/multer), [Cloudinary](https://cloudinary.com/), [Sharp](https://sharp.pixelplumbing.com/) |
| **Notifications** | [Nodemailer](https://nodemailer.com/) |
| **CORS & Security** | [cors](https://www.npmjs.com/package/cors), [dotenv](https://www.npmjs.com/package/dotenv) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** instance (Local or MongoDB Atlas connection string)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Uday-Shakya/driftlift_backend.git
   cd driftlift_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET_KEY=your_super_secret_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the API Server**:
   ```bash
   # Development with automatic restart
   npx nodemon index.js

   # Or standard start
   npm start
   ```

5. **Verify Server Health**:
   Visit [http://localhost:8000](http://localhost:8000). You should see:
   ```json
   { "message": "The API is working" }
   ```

---

## 📂 Project Structure

```text
driftlift_backend/
├── Middlewares/
│   ├── checkAuthToken.js     # JWT verification & token extraction
│   └── errorMiddleware.js    # Global error response handler
├── Models/
│   ├── AdminSchema.js        # Admin authorization schema
│   ├── UserSchema.js         # Core user schema with embedded biometric logs
│   └── WorkoutSchema.js      # Curated workout & exercise definitions
├── Routes/
│   ├── Admin.js              # Administrative endpoints
│   ├── Auth.js               # Registration, login, logout, profile
│   ├── CalorieIntake.js      # Nutritional tracking
│   ├── Report.js             # Aggregated health summaries
│   ├── SleepTrack.js         # Sleep duration & quality logs
│   ├── StepTrack.js          # Daily step counter
│   ├── WaterTrack.js         # Hydration volume tracking
│   ├── WeightTrack.js        # Body mass progression logs
│   ├── WorkoutPlans.js       # Curated exercise categories & routines
│   ├── WorkoutTrack.js       # User workout set & rep logging
│   └── imageUploadRoutes.js  # Cloudinary / Multer image upload
├── db.js                     # MongoDB connection setup
├── index.js                  # Express server entry point & route registration
├── package.json              # Backend dependencies
└── README.md                 # API documentation
```

---

## 🔗 Related Repositories

- **Frontend App**: [driftlift-front](https://github.com/Uday-Shakya/driftlift-front) (Next.js 15 / TypeScript / Three.js / MediaPipe)

---

## 📄 License

Distributed under the **MIT License**.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Uday-Shakya">Uday Shakya</a> & the DriftLift Team.</sub>
</div>
