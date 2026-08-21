import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance.js';

const CreateExam = () => {
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    duration: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.name.endsWith('.docx')) {
      setError('Only .docx files are allowed');
      setFile(null);
      return;
    }
    setError('');
    setFile(selectedFile);
  };

  const validateForm = () => {
    if (!formData.subjectName.trim()) return 'Subject name is required';
    if (!formData.subjectCode.trim()) return 'Subject code is required';
    if (!formData.duration || formData.duration <= 0) return 'Valid duration is required';
    if (!file) return 'Please upload a .docx file with questions';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const data = new FormData();
    data.append('subjectName', formData.subjectName);
    data.append('subjectCode', formData.subjectCode);
    data.append('duration', formData.duration);
    data.append('file', file);

    try {
      setLoading(true);
      const res = await axiosInstance.post('/exam/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(
        `Exam created successfully! ${res.data.totalQuestions} questions loaded, ${res.data.totalMarks} marks total.`
      );
      setFormData({ subjectName: '', subjectCode: '', duration: '' });
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Create New Exam
        </h1>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Data Structures"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Code
            </label>
            <input
              type="text"
              name="subjectCode"
              value={formData.subjectCode}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. CS301"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (in minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Questions (.docx)
            </label>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Q1. ... A) B) C) D) Answer: X
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Uploading...' : 'Create Exam'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;