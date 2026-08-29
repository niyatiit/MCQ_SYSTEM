import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ['BBA', 'BCA', 'BCOM', 'MCA', 'MBA', 'JMC', 'IMCA'],
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true, // will equal totalQuestions since 1 mark per question
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
  },
  { timestamps: true }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;