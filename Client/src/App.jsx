import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';

import StudentLogin from './pages/student/StudentLogin.jsx';
import StudentExam from './pages/student/StudentExam.jsx';
import ExamComplete from './pages/student/ExamComplete.jsx';

import CreateExam from './pages/teacher/CreateExam.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

import Navbar from './components/common/Navbar.jsx';
import Footer from './components/common/Footer.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/student" element={<StudentLogin />} />
            <Route path="/exam/:studentId" element={<StudentExam />} />
            <Route path="/exam-complete" element={<ExamComplete />} />

            <Route path="/teacher/create-exam" element={<CreateExam />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;