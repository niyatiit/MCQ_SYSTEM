import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';
import Student from '../models/student.model.js';
import Exam from '../models/exam.model.js';
import asyncHandler from 'express-async-handler';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// @desc    Admin login
// @route   POST /api/admin/login
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      username: admin.username,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid username or password');
  }
});

// @desc    Get all students (with exam status & marks)
// @route   GET /api/admin/students
const getAllStudents = async (req, res) => {
  const students = await Student.find({})
    .populate('exam', 'subjectName subjectCode')
    .sort({ createdAt: -1 });

  res.json(students);
};

// @desc    Get all exams created
// @route   GET /api/admin/exams
const getAllExams = async (req, res) => {
  const exams = await Exam.find({}).sort({ createdAt: -1 });
  res.json(exams);
};

export { loginAdmin, getAllStudents, getAllExams };