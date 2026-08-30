import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';

const DEPARTMENTS = ['BBA', 'BCA', 'BCOM', 'MCA', 'MBA', 'JMC', 'IMCA'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminToken, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', enrollmentNumber: '', department: '', semester: '' });

  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: authHeaders.headers,
        params: {
          department: departmentFilter || undefined,
          semester: semesterFilter || undefined,
        },
      };
      const [studentsRes, examsRes] = await Promise.all([
        axiosInstance.get('/admin/students', config),
        axiosInstance.get('/admin/exams', { headers: authHeaders.headers }),
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

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentFilter, semesterFilter]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleExport = async (type) => {
    setExporting(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/admin/export/${type}`, {
        headers: authHeaders.headers,
        params: {
          department: departmentFilter || undefined,
          semester: semesterFilter || undefined,
        },
        responseType: 'blob',
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'excel' ? 'student-results.xlsx' : 'student-results.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to export ${type.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // ---- Reset ----
  const handleReset = async (student) => {
    if (!window.confirm(`Reset exam attempt for ${student.name} (${student.enrollmentNumber})? They will be able to retake it.`)) {
      return;
    }
    clearMessages();
    setActionLoadingId(student._id);
    try {
      await axiosInstance.patch(`/admin/students/${student._id}/reset`, {}, authHeaders);
      setSuccess(`${student.name}'s exam has been reset. They can retake it now.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset student.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---- Delete ----
  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name} (${student.enrollmentNumber}) permanently? This cannot be undone.`)) {
      return;
    }
    clearMessages();
    setActionLoadingId(student._id);
    try {
      await axiosInstance.delete(`/admin/students/${student._id}`, authHeaders);
      setSuccess(`${student.name} was deleted.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---- Edit ----
  const openEditModal = (student) => {
    clearMessages();
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      department: student.department,
      semester: student.semester,
    });
  };

  const closeEditModal = () => {
    setEditingStudent(null);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosInstance.put(`/admin/students/${editingStudent._id}`, editForm, authHeaders);
      setSuccess('Student details updated successfully.');
      closeEditModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student.');
    }
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
      <div className="max-w-6xl mx-auto">
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
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Filters + Export */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
            <input
              type="text"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              placeholder="e.g. 5"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
            />
          </div>

          {(departmentFilter || semesterFilter) && (
            <button
              onClick={() => { setDepartmentFilter(''); setSemesterFilter(''); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition disabled:bg-gray-400"
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

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
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.enrollmentNumber}</td>
                    <td className="px-4 py-3">{s.department}</td>
                    <td className="px-4 py-3">{s.semester}</td>
                    <td className="px-4 py-3">{s.exam?.subjectName}</td>
                    <td className="px-4 py-3">{statusBadge(s.examStatus)}</td>
                    <td className="px-4 py-3 font-medium">
                      {s.examStatus === 'completed' ? s.marksObtained : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {s.examStatus !== 'not_started' && (
                          <button
                            onClick={() => handleReset(s)}
                            disabled={actionLoadingId === s._id}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
                            title="Allow this student to retake the exam"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(s)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={actionLoadingId === s._id}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
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
                  <th className="px-4 py-3">Department</th>
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
                    <td className="px-4 py-3">{ex.department}</td>
                    <td className="px-4 py-3">{ex.totalQuestions}</td>
                    <td className="px-4 py-3">{ex.totalMarks}</td>
                    <td className="px-4 py-3">{ex.duration} min</td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                      No exams created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Edit Student</h2>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  value={editForm.enrollmentNumber}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input
                  type="text"
                  name="semester"
                  value={editForm.semester}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;