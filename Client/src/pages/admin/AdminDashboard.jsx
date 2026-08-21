import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminToken, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${adminToken}` } };
        const [studentsRes, examsRes] = await Promise.all([
          axiosInstance.get('/admin/students', config),
          axiosInstance.get('/admin/exams', config),
        ]);
        setStudents(studentsRes.data);
        setExams(examsRes.data);
      } catch (err) {
        setError('Failed to load data. Please login again.');
        if (err.response?.status === 401) {
          logout();
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminToken]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const statusBadge = (status) => {
    const styles = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center mt-10 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded ${
              activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded ${
              activeTab === 'exams' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Exams ({exams.length})
          </button>
        </div>

        {/* Students Table */}
        {activeTab === 'students' && (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Enrollment No.</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Marks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.enrollmentNumber}</td>
                    <td className="px-4 py-3">{s.semester}</td>
                    <td className="px-4 py-3">{s.exam?.subjectName}</td>
                    <td className="px-4 py-3">{statusBadge(s.examStatus)}</td>
                    <td className="px-4 py-3 font-medium">
                      {s.examStatus === 'completed' ? s.marksObtained : '-'}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                      No students yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Exams Table */}
        {activeTab === 'exams' && (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Total Questions</th>
                  <th className="px-4 py-3">Total Marks</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{ex.subjectName}</td>
                    <td className="px-4 py-3">{ex.subjectCode}</td>
                    <td className="px-4 py-3">{ex.totalQuestions}</td>
                    <td className="px-4 py-3">{ex.totalMarks}</td>
                    <td className="px-4 py-3">{ex.duration} min</td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                      No exams created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;