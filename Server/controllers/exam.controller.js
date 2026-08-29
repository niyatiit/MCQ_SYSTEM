import asyncHandler from 'express-async-handler';
import mammoth from 'mammoth';
import fs from 'fs';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';

// @desc    Create exam by uploading Word file with MCQs
// @route   POST /api/exam/create
const createExam = asyncHandler(async (req, res) => {
  const { subjectName, subjectCode, department, duration } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a .docx file');
  }

  // Extract raw text from Word file
  const result = await mammoth.extractRawText({ path: req.file.path });
  const text = result.value;

  // Delete uploaded file after reading (cleanup)
  fs.unlinkSync(req.file.path);

  // Parse questions using regex pattern
  const questionBlocks = text
    .split(/Q\d+\./)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const parsedQuestions = [];

  for (const block of questionBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l);

    const questionText = lines[0];
    const options = [];
    let correctAnswer = '';

    for (const line of lines.slice(1)) {
      if (/^A\)/.test(line)) options.push(line.replace(/^A\)\s*/, ''));
      else if (/^B\)/.test(line)) options.push(line.replace(/^B\)\s*/, ''));
      else if (/^C\)/.test(line)) options.push(line.replace(/^C\)\s*/, ''));
      else if (/^D\)/.test(line)) options.push(line.replace(/^D\)\s*/, ''));
      else if (/^Answer:/i.test(line)) correctAnswer = line.replace(/^Answer:\s*/i, '').trim();
    }

    if (questionText && options.length === 4 && correctAnswer) {
      parsedQuestions.push({ questionText, options, correctAnswer });
    }
  }

  if (parsedQuestions.length === 0) {
    res.status(400);
    throw new Error('No valid questions found. Check your Word file format.');
  }

  // Create Exam first
  const exam = await Exam.create({
    subjectName,
    subjectCode,
    department,
    totalQuestions: parsedQuestions.length,
    totalMarks: parsedQuestions.length,
    duration,
    questions: [],
  });

  // Create Questions linked to this exam
  const questionDocs = await Question.insertMany(
    parsedQuestions.map((q) => ({ ...q, exam: exam._id }))
  );

  // Link question IDs back to exam
  exam.questions = questionDocs.map((q) => q._id);
  await exam.save();

  res.status(201).json(exam);
});

// @desc    Get single exam by ID (for student to start exam)
// @route   GET /api/exam/:id
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json(exam);
});

// @desc    Get all exams (for student to choose subject)
// @route   GET /api/exam
const getAllExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({}).select('subjectName subjectCode department duration totalQuestions');
  res.json(exams);
});

export { createExam, getExamById, getAllExams };