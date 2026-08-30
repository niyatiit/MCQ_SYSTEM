# SVGU MCQ Examination System

A secure, no-login MCQ exam portal built on the MERN stack. Students register with their enrollment number and department, take a timed and randomized exam with anti-cheating protection, and results are scored and stored privately for admin review — never shown to the student.

**Live URLs**
- Frontend (Vercel): https://mcq-system-six.vercel.app/
- Backend (Render): https://mcq-system-d9vt.onrender.com/

---

## Features

### Student
- No login required — just name, enrollment number, department, and semester
- Department dropdown: `BBA`, `BCA`, `BCOM`, `MCA`, `MBA`, `JMC`, `IMCA`
- Subject/exam list is filtered by department — a student only ever sees exams created for their own department
- One attempt per enrollment number per department (even across different subjects)
- Timed exam with randomized question order — every student gets the same question pool in a different shuffle
- **Anti-cheating lock** during the exam:
  - Fullscreen is forced on start; navbar and footer are hidden
  - Tab switching, window blur, or exiting fullscreen counts as a violation
  - After 3 violations, the exam auto-submits
  - Right-click, copy/paste, and common devtools/print/save shortcuts are disabled
  - Accidental refresh/close shows a native browser confirmation prompt
- Score is calculated and stored server-side — **never returned to the student**

### Teacher
- Create an exam by uploading a `.docx` file of questions (no manual question entry needed)
- Sets subject name, subject code, department, and exam duration
- Questions are parsed automatically and linked to the exam

### Admin
- Secure login (JWT-based), with credentials stored hashed in the database
- Auto-logout the moment the admin navigates away from any `/admin/*` route — prevents another person on a shared computer from viewing the dashboard after the admin walks away
- Dashboard with two tabs: **Students** and **Exams**
- Filter results by **department** and **semester**
- Export filtered results as **Excel (.xlsx)** or a styled **PDF report** (with department/semester heading, color-coded status, and generation timestamp)
- Per-student actions:
  - **Reset** — clears a student's in-progress/completed exam status so they can retake it (e.g. if their exam was interrupted unfairly)
  - **Edit** — update a student's name, enrollment number, department, or semester
  - **Delete** — permanently remove a student record

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express (ES Modules) |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (admin only — students have no login) |
| File parsing | Mammoth (.docx → text) |
| Export | ExcelJS (.xlsx), PDFKit (.pdf) |
| File uploads | Multer |
| Hosting | Render (backend), Vercel (frontend) |

---

## Project Structure

```
mcq_system/
├── Server/                      # Backend (Express API)
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── admin.controller.js  # Login, students, exams, export, reset/edit/delete
│   │   ├── exam.controller.js   # Create exam (.docx parsing), get exams
│   │   └── student.controller.js# Register, start exam, get questions, submit
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification for admin routes
│   │   └── upload.middleware.js # Multer config
│   ├── models/
│   │   ├── admin.model.js
│   │   ├── student.model.js
│   │   ├── exam.model.js
│   │   └── question.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── exam.routes.js
│   │   └── student.routes.js
│   ├── uploads/                 # Temporary storage for uploaded .docx files
│   ├── seedAdmin.js             # One-time script to create/reset the admin account
│   ├── server.js                # App entry point
│   ├── .env                     # Environment variables (not committed)
│   └── package.json
│
└── client/                      # Frontend (React + Vite)
    ├── src/
    │   ├── api/
    │   │   └── axiosInstance.js # Axios instance pointed at the backend URL
    │   ├── context/
    │   │   ├── AuthContext.jsx      # Admin JWT state (persisted in localStorage)
    │   │   └── ExamModeContext.jsx  # Hides navbar/footer during an active exam
    │   ├── components/common/
    │   │   ├── Navbar.jsx
    │   │   └── Footer.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── student/
    │   │   │   ├── StudentLogin.jsx   # Registration form
    │   │   │   ├── StudentExam.jsx    # Exam + anti-cheating logic
    │   │   │   └── ExamComplete.jsx
    │   │   ├── teacher/
    │   │   │   └── CreateExam.jsx     # Upload .docx to create an exam
    │   │   └── admin/
    │   │       ├── AdminLogin.jsx
    │   │       └── AdminDashboard.jsx # Filters, export, reset/edit/delete
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Local Setup

### Backend

```bash
cd Server
npm install
```

Create a `.env` file in `Server/`:

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
NODE_ENV=development
```

Seed the admin account (creates or resets it with the credentials in `seedAdmin.js`):

```bash
npm run seed:admin
```

Start the server:

```bash
npm run dev
```

Runs on `http://localhost:3000`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`. The backend URL is set directly in `src/api/axiosInstance.js` — update it if your backend URL changes:

```js
const axiosInstance = axios.create({
  baseURL: 'https://mcq-system-d9vt.onrender.com/api', // or http://localhost:3000/api for local-only testing
});
```

---

## Question Upload Format (.docx)

When a teacher creates an exam, the uploaded Word document **must** follow this exact pattern:

```
Q1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B

Q2. Which language runs natively in a web browser?
A) Python
B) C++
C) JavaScript
D) Java
Answer: C
```

Rules:
- Each question must start with `Q` followed by a number and a period (`Q1.`, `Q2.`, ...)
- Exactly 4 options, labeled `A)`, `B)`, `C)`, `D)`
- An `Answer:` line with the correct letter
- One mark is awarded per question; total marks = total questions

---

## Deployment

### Backend — Render
- **Root Directory**: `Server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables** (set in Render dashboard, not committed):
  ```
  MONGO_URI=...
  JWT_SECRET=...
  NODE_ENV=production
  ```
  (`PORT` is set automatically by Render — don't add it manually)

### Frontend — Vercel
- **Root Directory**: `client`
- **Framework Preset**: Vite (auto-detected)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)

### CORS
The backend restricts allowed origins in `server.js`:

```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mcq-system-six.vercel.app',
  ],
  credentials: true,
}));
```

If the frontend URL changes, update this list and redeploy the backend (push to GitHub — Render auto-deploys on push).

> **Free tier note:** Render's free instance spins down after ~15 minutes of inactivity. The first request after idling can take 30–60 seconds to respond. For real exam use with many students, consider upgrading to a paid Render plan to avoid this delay.

---

## Security Notes

- Admin password is hashed (bcrypt) before being stored — never stored in plain text
- Admin session auto-clears (`logout()`) the moment the admin navigates to any non-admin route, so a shared computer can't leak the dashboard to the next person who clicks "Admin"
- A department mismatch between a student's selected department and an exam's department is rejected both in the UI and independently re-validated on the backend (`exam.department !== department` check in `registerStudent`), so this can't be bypassed via direct API calls
- Student scores are never included in any API response sent to the student — only the admin's authenticated endpoints expose marks
- To change the admin password: update the credentials in `seedAdmin.js`, then run `npm run seed:admin` again (the script clears the existing admin before creating the new one)

---

## Possible Future Improvements

- Move admin credentials/exam settings (duration, questions-per-exam) into a database-backed `Settings` model editable from the dashboard, rather than hardcoded values
- Add a "Change Password" feature directly in the admin dashboard instead of re-running the seed script
- Add pagination to the admin students table for large datasets
- Upgrade Render to a paid tier (or add a keep-alive ping) to avoid free-tier cold starts during live exams
