import Student from '../models/student.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import asyncHandler from 'express-async-handler';

// Utility: shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// @desc    Register student info (fake login) + link to exam
// @route   POST /api/student/register
const registerStudent = asyncHandler(async (req, res) => {
  const { name, enrollmentNumber, department, semester, subjectName, examId } = req.body;

  if (!department) {
    res.status(400);
    throw new Error('Department is required');
  }

  // Verify the exam actually belongs to the student's selected department
  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  if (exam.department !== department) {
    res.status(403);
    throw new Error('This exam is not available for your department');
  }

  // Check if this enrollment number has ALREADY taken any exam in this department
  const existingInDepartment = await Student.findOne({ enrollmentNumber, department });

  if (existingInDepartment) {
    if (existingInDepartment.exam.toString() === examId) {
      // Same student, same exam — check status (edge case: retry before starting)
      if (existingInDepartment.examStatus === 'completed') {
        res.status(400);
        throw new Error('You have already completed this exam');
      }
      if (existingInDepartment.examStatus === 'in_progress') {
        res.status(400);
        throw new Error('Exam already in progress. You cannot restart.');
      }
      return res.json(existingInDepartment);
    }

    // Same enrollment number, but a DIFFERENT exam within the same department — block
    res.status(403);
    throw new Error('This enrollment number has already registered for an exam in this department');
  }

  // New student entry
  const student = await Student.create({
    name,
    enrollmentNumber,
    department,
    semester,
    subjectName,
    exam: examId,
    examStatus: 'not_started',
  });

  res.status(201).json(student);
});

// @desc    Start exam - shuffle questions, lock status
// @route   POST /api/student/:id/start
const startExam = async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (student.examStatus === 'in_progress') {
    res.status(400);
    throw new Error('Exam already in progress. Resuming is not allowed.');
  }

  if (student.examStatus === 'completed') {
    res.status(400);
    throw new Error('You have already completed this exam');
  }

  const exam = await Exam.findById(student.exam).populate('questions');

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const shuffledQuestionIds = shuffleArray(exam.questions.map((q) => q._id));

  student.questionOrder = shuffledQuestionIds;
  student.examStatus = 'in_progress';
  await student.save();

  res.json({
    student,
    duration: exam.duration,
    totalQuestions: exam.totalQuestions,
  });
};

// @desc    Get questions for student in their shuffled order (no correct answers exposed)
// @route   GET /api/student/:id/questions
const getExamQuestions = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (student.examStatus !== 'in_progress') {
    res.status(400);
    throw new Error('Exam not started or already completed');
  }

  const questions = await Question.find({
    _id: { $in: student.questionOrder },
  }).select('-correctAnswer');

  const orderedQuestions = student.questionOrder.map((qId) =>
    questions.find((q) => q._id.toString() === qId.toString())
  );

  res.json(orderedQuestions);
});

// @desc    Submit exam - calculate marks, lock student as completed
// @route   POST /api/student/:id/submit
const submitExam = asyncHandler(async (req, res) => {
  const { answers } = req.body;

  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (student.examStatus === 'completed') {
    res.status(400);
    throw new Error('Exam already submitted');
  }

  if (student.examStatus !== 'in_progress') {
    res.status(400);
    throw new Error('Exam was not started properly');
  }

  const questions = await Question.find({
    _id: { $in: student.questionOrder },
  });

  let marks = 0;
  for (const ans of answers) {
    const question = questions.find((q) => q._id.toString() === ans.questionId);
    if (question && question.correctAnswer === ans.selectedOption) {
      marks += 1;
    }
  }

  student.marksObtained = marks;
  student.examStatus = 'completed';
  student.submittedAt = new Date();
  await student.save();

  res.json({ message: 'Exam submitted successfully' });
});

export { registerStudent, startExam, getExamQuestions, submitExam };