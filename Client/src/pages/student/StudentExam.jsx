import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { useExamMode } from '../../context/ExamModeContext.jsx';

const MAX_VIOLATIONS = 3;

const StudentExam = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { setIsExamActive } = useExamMode();

  const [stage, setStage] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');

  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const violationCountRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const formattedAnswers = Object.entries(answersRef.current).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));

    try {
      await axiosInstance.post(`/student/${studentId}/submit`, { answers: formattedAnswers });
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      setIsExamActive(false);   // NEW: show Navbar/Footer again
      navigate('/exam-complete');
    }
  }, [studentId, navigate, setIsExamActive]);

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const registerViolation = useCallback((reason) => {
    if (stage !== 'exam' || submittedRef.current) return;

    violationCountRef.current += 1;
    setViolationCount(violationCountRef.current);

    if (violationCountRef.current >= MAX_VIOLATIONS) {
      setWarningMessage('Too many violations detected. Auto-submitting your exam...');
      setTimeout(() => handleSubmit(), 1500);
    } else {
      setWarningMessage(
        `Warning ${violationCountRef.current}/${MAX_VIOLATIONS}: ${reason}. Exam will auto-submit if this happens again.`
      );
    }
  }, [stage, handleSubmit]);

  useEffect(() => {
    if (stage !== 'exam') return undefined;

    const handleVisibilityChange = () => {
      if (document.hidden) registerViolation('You switched tabs or minimized the window');
    };
    const handleBlur = () => registerViolation('You left the exam window');
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) registerViolation('You exited fullscreen mode');
    };
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopyPaste = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'u', 'p', 's'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stage, registerViolation]);

  // Safety net: if component unmounts unexpectedly, restore navbar + exit fullscreen
  useEffect(() => {
    return () => {
      setIsExamActive(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartExam = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(`/student/${studentId}/start`);
      setDuration(data.duration);
      setTimeLeft(data.duration * 60);

      const questionsRes = await axiosInstance.get(`/student/${studentId}/questions`);
      setQuestions(questionsRes.data);

      enterFullscreen();
      setIsExamActive(true);   // NEW: hide Navbar/Footer now
      setStage('exam');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage !== 'exam' || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft, handleSubmit]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOptionSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  if (stage === 'start') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ready to Begin?</h1>
          <p className="text-gray-600 mb-6">
            Once you click "Start Exam", the screen will go fullscreen and lock — the navigation bar
            will disappear. Switching tabs, minimizing, or exiting fullscreen counts as a violation —
            after {MAX_VIOLATIONS} violations your exam auto-submits. You <strong>cannot pause, leave, or restart</strong> the exam.
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

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return <div className="text-center mt-10">Loading questions...</div>;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 px-4 py-6 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="max-w-2xl mx-auto">
        {warningMessage && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 text-sm font-medium">
            ⚠ {warningMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-6 bg-white shadow rounded-lg px-4 py-3">
          <span className="font-medium text-gray-700">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className={`font-bold text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

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