const ExamComplete = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Exam Submitted Successfully
        </h1>
        <p className="text-gray-600">
          Thank you for completing the exam. Your responses have been recorded.
        </p>
      </div>
    </div>
  );
};

export default ExamComplete;