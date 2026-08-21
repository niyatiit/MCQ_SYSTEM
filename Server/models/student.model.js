import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    examStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    questionOrder: {
      type: [mongoose.Schema.Types.ObjectId], // shuffled question IDs for this student
      default: [],
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);
export default Student;