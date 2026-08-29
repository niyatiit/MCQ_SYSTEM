import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Navbar = () => {
  const location = useLocation();
  const { adminToken } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Student', path: '/student' },
    { name: 'Teacher', path: '/teacher/create-exam' },
    { name: 'Admin', path: adminToken ? '/admin/dashboard' : '/admin/login' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs">
            MC
          </span>
          <span className="text-gray-800 font-semibold text-sm tracking-wide hidden sm:block">
            MCQ Examination System
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive(link.path)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 