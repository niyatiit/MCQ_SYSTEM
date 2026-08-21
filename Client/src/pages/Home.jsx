import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Fill Your Details',
      description: 'Enter your name, enrollment number, semester and select your subject.',
    },
    {
      title: 'Start the Exam',
      description: 'Click "Start Exam" once you\'re ready — the timer begins immediately.',
    },
    {
      title: 'Answer MCQs',
      description: 'Questions appear one at a time. Navigate using Previous/Next buttons.',
    },
    {
      title: 'Submit',
      description: 'Submit before time runs out, or it auto-submits when the timer ends.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide mb-4">
            STUDENT PORTAL
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            MCQ Examination System
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Attempt your subject exam online. Make sure you have a stable internet
            connection before you begin — the exam cannot be paused or restarted once started.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white shadow-sm border border-gray-100 rounded-xl p-5 flex gap-4"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0">
                {idx + 1}
              </span>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Once you start the exam, leaving the page or
            losing connection will lock you out — you will not be able to re-enter or restart.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate('/student')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-blue-600/20"
          >
            Proceed to Exam Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;