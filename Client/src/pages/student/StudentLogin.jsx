import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';

const DEPARTMENTS = ['BBA', 'BCA', 'BCOM', 'MCA', 'MBA', 'JMC', 'IMCA'];

const StudentLogin = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    enrollmentNumber: '',
    department: '',
    semester: '',
    examId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch exams whenever department changes
  useEffect(() => {
    if (!formData.department) {
      setExams([]);
      return;
    }

    const fetchExams = async () => {
      try {
        const { data } = await axiosInstance.get('/exam', {
          params: { department: formData.department },
        });
        setExams(data);
      } catch (err) {
        setError('Failed to load exams. Please refresh.');
      }
    };
    fetchExams();
  }, [formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // reset selected exam whenever department changes, so a stale exam from another dept can't stay selected
      ...(name === 'department' ? { examId: '' } : {}),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.enrollmentNumber.trim()) return 'Enrollment number is required';
    if (!formData.department) return 'Please select your department';
    if (!formData.semester.trim()) return 'Semester is required';
    if (!formData.examId) return 'Please select a subject/exam';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const selectedExam = exams.find((ex) => ex._id === formData.examId);

    try {
      setLoading(true);
      const { data } = await axiosInstance.post('/student/register', {
        ...formData,
        subjectName: selectedExam.subjectName,
      });

      navigate(`/exam/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Student Exam Login
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enrollment Number
            </label>
            <input
              type="text"
              name="enrollmentNumber"
              value={formData.enrollmentNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 21CS001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Department --</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject
            </label>
            <select
              name="examId"
              value={formData.examId}
              onChange={handleChange}
              disabled={!formData.department}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {formData.department ? '-- Select Subject --' : 'Select a department first'}
              </option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.subjectName} ({exam.subjectCode}) - {exam.totalQuestions} Qs, {exam.duration} min
                </option>
              ))}
            </select>
            {formData.department && exams.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No exams available yet for {formData.department}.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : 'Proceed'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;