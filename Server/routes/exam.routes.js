import express from 'express';
import { createExam, getExamById } from '../controllers/exam.controller.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/create', upload.single('file'), createExam);
router.get('/:id', getExamById);

export default router;