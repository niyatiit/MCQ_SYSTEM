import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';

const StudentExam = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState('start'); // 'start' | 'exam'
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(0); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Start Exam handler
  const handleStartExam = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(`/student/${studentId}/start`);
      setDuration(data.duration);
      setTimeLeft(data.duration * 60); // convert minutes to seconds

      // Fetch questions right after starting
      const questionsRes = await axiosInstance.get(`/student/${studentId}/questions`);
      setQuestions(questionsRes.data);

      setStage('exam');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (stage !== 'exam' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // auto-submit when time ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOptionSelect = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

    try {
      await axiosInstance.post(`/student/${studentId}/submit`, { answers: formattedAnswers });
      navigate('/exam-complete');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  // ---------- START SCREEN ----------
  if (stage === 'start') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ready to Begin?</h1>
          <p className="text-gray-600 mb-6">
            Once you click "Start Exam", the timer will begin and you <strong>cannot pause, leave, or restart</strong> the exam.
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStartExam}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Starting...' : 'Start Exam'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- EXAM SCREEN ----------
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return <div className="text-center mt-10">Loading questions...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header: Timer + Progress */}
        <div className="flex justify-between items-center mb-6 bg-white shadow rounded-lg px-4 py-3">
          <span className="font-medium text-gray-700">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className={`font-bold text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = answers[currentQuestion._id] === optionLetter;

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(currentQuestion._id, optionLetter)}
                  className={`w-full text-left px-4 py-3 rounded border transition ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold mr-2">{optionLetter})</span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Submit Exam
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mt-4 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExam;