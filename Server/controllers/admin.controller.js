import jwt from "jsonwebtoken";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Admin from "../models/admin.model.js";
import Student from "../models/student.model.js";
import Exam from "../models/exam.model.js";
import asyncHandler from "express-async-handler";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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
    throw new Error("Invalid username or password");
  }
});

// Helper: build a Mongo filter from query params
const buildStudentFilter = (query) => {
  const filter = {};
  if (query.department) filter.department = query.department;
  if (query.semester) filter.semester = query.semester;
  return filter;
};

// @desc    Get all students (with exam status & marks), supports ?department=&semester=
// @route   GET /api/admin/students
const getAllStudents = asyncHandler(async (req, res) => {
  const filter = buildStudentFilter(req.query);

  const students = await Student.find(filter)
    .populate("exam", "subjectName subjectCode")
    .sort({ createdAt: -1 });

  res.json(students);
});

// @desc    Get all exams created
// @route   GET /api/admin/exams
const getAllExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({}).sort({ createdAt: -1 });
  res.json(exams);
});

// @desc    Export students as Excel, supports ?department=&semester=
// @route   GET /api/admin/export/excel
const exportStudentsExcel = asyncHandler(async (req, res) => {
  const filter = buildStudentFilter(req.query);

  const students = await Student.find(filter)
    .populate("exam", "subjectName subjectCode")
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  sheet.columns = [
    { header: "Name", key: "name", width: 22 },
    { header: "Enrollment No.", key: "enrollmentNumber", width: 18 },
    { header: "Department", key: "department", width: 14 },
    { header: "Semester", key: "semester", width: 12 },
    { header: "Subject", key: "subject", width: 24 },
    { header: "Status", key: "status", width: 14 },
    { header: "Marks", key: "marks", width: 10 },
    { header: "Submitted At", key: "submittedAt", width: 20 },
  ];

  students.forEach((s) => {
    sheet.addRow({
      name: s.name,
      enrollmentNumber: s.enrollmentNumber,
      department: s.department,
      semester: s.semester,
      subject: s.exam?.subjectName || "-",
      status: s.examStatus,
      marks: s.examStatus === "completed" ? s.marksObtained : "-",
      submittedAt: s.submittedAt
        ? new Date(s.submittedAt).toLocaleString()
        : "-",
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=student-results.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
});

// @desc    Export students as PDF, supports ?department=&semester=
// @route   GET /api/admin/export/pdf
const exportStudentsPDF = asyncHandler(async (req, res) => {
  const filter = buildStudentFilter(req.query);

  const students = await Student.find(filter)
    .populate("exam", "subjectName subjectCode")
    .sort({ createdAt: -1 });

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=student-results.pdf",
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ---- Header banner ----
  doc.rect(0, 0, pageWidth, 70).fill("#1e3a8a"); // dark blue banner
  doc
    .fillColor("#ffffff")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("MCQ Examination System", marginLeft, 18, {
      width: contentWidth,
      align: "center",
    });
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Student Exam Results Report", marginLeft, 44, {
      width: contentWidth,
      align: "center",
    });

  doc.moveDown(3);
  doc.fillColor("#000000");

  // ---- Department / Semester subheading box ----
  const deptLabel = filter.department ? filter.department : "All Departments";
  const semLabel = filter.semester
    ? `Semester ${filter.semester}`
    : "All Semesters";

  const boxY = 90;
  doc
    .rect(marginLeft, boxY, contentWidth, 30)
    .fill("#eff6ff")
    .stroke("#1e3a8a");
  doc
    .fillColor("#1e3a8a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `Department: ${deptLabel}      |      ${semLabel}      |      Generated: ${new Date().toLocaleString()}`,
      marginLeft + 10,
      boxY + 9,
    );

  doc.fillColor("#000000");

  // ---- Table ----
  const tableTop = boxY + 45;
  const colWidths = [110, 90, 70, 60, 130, 80, 50, 100];
  const headers = [
    "Name",
    "Enrollment No.",
    "Department",
    "Semester",
    "Subject",
    "Status",
    "Marks",
    "Submitted At",
  ];

  const drawTableHeader = (y) => {
    let x = marginLeft;
    doc.rect(marginLeft, y, contentWidth, 22).fill("#1e3a8a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 6, { width: colWidths[i] - 6 });
      x += colWidths[i];
    });
    doc.fillColor("#000000");
    return y + 22;
  };

  let y = drawTableHeader(tableTop);
  doc.font("Helvetica").fontSize(9);

  students.forEach((s, idx) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = drawTableHeader(doc.page.margins.top);
    }

    // alternating row background
    if (idx % 2 === 0) {
      doc.rect(marginLeft, y, contentWidth, 20).fill("#f8fafc");
      doc.fillColor("#000000");
    }

    let x = marginLeft;
    const row = [
      s.name,
      s.enrollmentNumber,
      s.department,
      s.semester,
      s.exam?.subjectName || "-",
      s.examStatus.replace("_", " "),
      s.examStatus === "completed" ? String(s.marksObtained) : "-",
      s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "-",
    ];

    row.forEach((cell, i) => {
      // color status text
      if (i === 5) {
        const statusColors = {
          completed: "#16a34a",
          in_progress: "#ca8a04",
          not_started: "#6b7280",
        };
        doc.fillColor(statusColors[s.examStatus] || "#000000");
      } else {
        doc.fillColor("#000000");
      }
      doc.text(cell || "-", x + 4, y + 6, { width: colWidths[i] - 6 });
      x += colWidths[i];
    });

    doc.fillColor("#000000");
    y += 20;
  });

  // ---- Footer ----
  doc
    .fontSize(8)
    .fillColor("#6b7280")
    .text(
      `Total Records: ${students.length}`,
      marginLeft,
      doc.page.height - 30,
      { align: "left" },
    );

  doc.end();
});

// @desc    Reset a student's exam attempt (allow retake)
// @route   PATCH /api/admin/students/:id/reset
const resetStudentExam = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  student.examStatus = "not_started";
  student.questionOrder = [];
  student.marksObtained = 0;
  student.submittedAt = undefined;
  await student.save();

  res.json({
    message: "Student exam reset successfully. They can now retake the exam.",
    student,
  });
});

// @desc    Edit student details (name, enrollmentNumber, department, semester)
// @route   PUT /api/admin/students/:id
const updateStudent = asyncHandler(async (req, res) => {
  const { name, enrollmentNumber, department, semester } = req.body;

  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  if (name !== undefined) student.name = name;
  if (enrollmentNumber !== undefined)
    student.enrollmentNumber = enrollmentNumber;
  if (department !== undefined) student.department = department;
  if (semester !== undefined) student.semester = semester;

  await student.save();

  res.json({ message: "Student updated successfully", student });
});

// @desc    Delete a student record
// @route   DELETE /api/admin/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  await student.deleteOne();

  res.json({ message: "Student deleted successfully" });
});

export {
  loginAdmin,
  getAllStudents,
  getAllExams,
  exportStudentsExcel,
  exportStudentsPDF,
  resetStudentExam,
  updateStudent,
  deleteStudent,
};
