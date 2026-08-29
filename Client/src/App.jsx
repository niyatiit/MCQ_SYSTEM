import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

import Home from './pages/Home.jsx';
import StudentLogin from './pages/student/StudentLogin.jsx';
import StudentExam from './pages/student/StudentExam.jsx';
import ExamComplete from './pages/student/ExamComplete.jsx';
import CreateExam from './pages/teacher/CreateExam.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Navbar from './components/common/Navbar.jsx';
import Footer from './components/common/Footer.jsx';
import { useExamMode } from './context/ExamModeContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

const AppLayout = () => {
  const { isExamActive } = useExamMode();
  const { adminToken, logout } = useAuth();
  const location = useLocation();
  const hasMountedRef = useRef(false);

  // Auto-logout admin the moment they navigate to any non-admin route
  useEffect(() => {
    // skip the very first render (page load / refresh) so a direct
    // reload of /admin/dashboard doesn't instantly log the admin out
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const isAdminRoute = location.pathname.startsWith('/admin');

    if (!isAdminRoute && adminToken) {
      logout();
    }
  }, [location.pathname, adminToken, logout]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isExamActive && <Navbar />}

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

      {!isExamActive && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;