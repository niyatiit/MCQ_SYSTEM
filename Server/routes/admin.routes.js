import express from 'express';
import { loginAdmin, getAllStudents, getAllExams } from '../controllers/admin.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/students', protect, getAllStudents);
router.get('/exams', protect, getAllExams);

export default router;