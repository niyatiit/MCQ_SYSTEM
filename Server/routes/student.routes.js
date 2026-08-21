import express from 'express';
import {
  registerStudent,
  startExam,
  getExamQuestions,
  submitExam,
} from '../controllers/student.controller.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/:id/start', startExam);
router.get('/:id/questions', getExamQuestions);
router.post('/:id/submit', submitExam);

export default router;