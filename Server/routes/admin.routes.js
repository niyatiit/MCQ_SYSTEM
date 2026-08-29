import express from 'express';
import {
  loginAdmin,
  getAllStudents,
  getAllExams,
  exportStudentsExcel,
  exportStudentsPDF,
} from '../controllers/admin.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/students', protect, getAllStudents);
router.get('/exams', protect, getAllExams);
router.get('/export/excel', protect, exportStudentsExcel);
router.get('/export/pdf', protect, exportStudentsPDF);

export default router;