import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String], // array of 4 options
      required: true,
      validate: [(val) => val.length === 4, 'Exactly 4 options required'],
    },
    correctAnswer: {
      type: String, // stores the correct option text (or 'A'/'B'/'C'/'D')
      required: true,
    },
  },
  { timestamps: true }
);

const Questions = mongoose.model('Question', questionSchema);
export default Questions;