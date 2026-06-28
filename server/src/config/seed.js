// server/src/config/seed.js

const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const User = require("../models/User");
const Clearance = require("../models/Clearance");

// ==========================================
// DEPARTMENTS
// ==========================================

const DEPARTMENTS = [
  "Head of Music",
  "Head of Drama",
  "Head of Industrial Liaison (ILO)",
  "Head of Guidance & Counselling",
  "Head of Sports (Games items)",
  "Head of Library",
  "Housekeeper (Beddings)",
  "Stores Controller",
  "Storekeeper (Department)",
  "Head of Department (HOD)",
  "Exams Officer (Department)",
  "Dean of Students (College ID)",
  "Fees Balance (KShs)",
  "Registrar (Administration)",
];

// ==========================================
// ADMIN
// ==========================================

const admin = {
  fullName: "Dr. James Mwangi",
  idNumber: "ADMIN001",
  password: "admin123",
  role: "admin",
  department: "Administration",
};

// ==========================================
// OFFICERS
// ==========================================

const officers = [
  {
    fullName: "Mary Achieng",
    idNumber: "OFF001",
    password: "officer123",
    role: "officer",
    department: "Head of Music",
  },
  {
    fullName: "Peter Kamau",
    idNumber: "OFF002",
    password: "officer123",
    role: "officer",
    department: "Head of Drama",
  },
  {
    fullName: "Grace Wanjiru",
    idNumber: "OFF003",
    password: "officer123",
    role: "officer",
    department: "Head of Industrial Liaison (ILO)",
  },
  {
    fullName: "John Omondi",
    idNumber: "OFF004",
    password: "officer123",
    role: "officer",
    department: "Head of Guidance & Counselling",
  },
  {
    fullName: "Susan Chebet",
    idNumber: "OFF005",
    password: "officer123",
    role: "officer",
    department: "Head of Sports (Games items)",
  },
  {
    fullName: "David Mutua",
    idNumber: "OFF006",
    password: "officer123",
    role: "officer",
    department: "Head of Library",
  },
  {
    fullName: "Alice Njoroge",
    idNumber: "OFF007",
    password: "officer123",
    role: "officer",
    department: "Housekeeper (Beddings)",
  },
  {
    fullName: "Robert Otieno",
    idNumber: "OFF008",
    password: "officer123",
    role: "officer",
    department: "Stores Controller",
  },
  {
    fullName: "Jane Waweru",
    idNumber: "OFF009",
    password: "officer123",
    role: "officer",
    department: "Storekeeper (Department)",
  },
  {
    fullName: "Michael Kipchoge",
    idNumber: "OFF010",
    password: "officer123",
    role: "officer",
    department: "Head of Department (HOD)",
  },
  {
    fullName: "Elizabeth Muthoni",
    idNumber: "OFF011",
    password: "officer123",
    role: "officer",
    department: "Exams Officer (Department)",
  },
  {
    fullName: "Samuel Gitau",
    idNumber: "OFF012",
    password: "officer123",
    role: "officer",
    department: "Dean of Students (College ID)",
  },
  {
    fullName: "Catherine Auma",
    idNumber: "OFF013",
    password: "officer123",
    role: "officer",
    department: "Fees Balance (KShs)",
  },
  {
    fullName: "Joseph Kariuki",
    idNumber: "OFF014",
    password: "officer123",
    role: "officer",
    department: "Registrar (Administration)",
  },
];

// ==========================================
// STUDENTS
// ==========================================

const students = [
  {
    fullName: "Wanjiku Otieno",
    admNo: "ADM/2024/087",
    idNumber: "ADM/2024/087",
    password: "student123",
    role: "student",
    course: "ICT",
    department: "Computing",
    nationalId: "32847291",
    parentGuardianName: "Joseph Otieno",
    permanentAddress: "P.O Box 441, Nakuru",
    phone1: "0712345678",
    phone2: "",
  },
  {
    fullName: "Brian Kamau",
    admNo: "ADM/2024/041",
    idNumber: "ADM/2024/041",
    password: "student123",
    role: "student",
    course: "Business",
    department: "Business Studies",
    nationalId: "31234567",
    parentGuardianName: "Peter Kamau",
    permanentAddress: "P.O Box 112, Nairobi",
    phone1: "0733445566",
    phone2: "",
  },
  {
    fullName: "Aisha Mohamed",
    admNo: "ADM/2024/112",
    idNumber: "ADM/2024/112",
    password: "student123",
    role: "student",
    course: "Electrical Engineering",
    department: "Engineering",
    nationalId: "34567890",
    parentGuardianName: "Hassan Mohamed",
    permanentAddress: "P.O Box 78, Mombasa",
    phone1: "0711223344",
    phone2: "",
  },
  {
    fullName: "Collins Mwangi",
    admNo: "ADM/2024/033",
    idNumber: "ADM/2024/033",
    password: "student123",
    role: "student",
    course: "ICT",
    department: "Computing",
    nationalId: "30987654",
    parentGuardianName: "James Mwangi",
    permanentAddress: "P.O Box 56, Nakuru",
    phone1: "0722334455",
    phone2: "",
  },
  {
    fullName: "Fatuma Hassan",
    admNo: "ADM/2024/078",
    idNumber: "ADM/2024/078",
    password: "student123",
    role: "student",
    course: "Hospitality Management",
    department: "Hospitality",
    nationalId: "33456789",
    parentGuardianName: "Hassan Omar",
    permanentAddress: "P.O Box 34, Kisumu",
    phone1: "0744556677",
    phone2: "",
  },
  {
    fullName: "David Ochieng",
    admNo: "ADM/2024/055",
    idNumber: "ADM/2024/055",
    password: "student123",
    role: "student",
    course: "Mechanical Engineering",
    department: "Engineering",
    nationalId: "32345678",
    parentGuardianName: "Ochieng Onyango",
    permanentAddress: "P.O Box 89, Eldoret",
    phone1: "0755667788",
    phone2: "",
  },
];

// ==========================================
// Seed Database
// ==========================================

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected.");

    // ==========================================
    // Clear Existing Data
    // ==========================================

    await User.deleteMany({});
    await Clearance.deleteMany({});

    console.log("Existing users and clearance records removed.");

    // ==========================================
    // Create Admin
    // ==========================================

    const createdAdmin = await User.create(admin);

    console.log("✅ Admin created");

    // ==========================================
    // Create Officers
    // ==========================================

    const createdOfficers = [];

    for (const officer of officers) {
      const createdOfficer = await User.create(officer);
      createdOfficers.push(createdOfficer);
    }

    console.log(`✅ ${createdOfficers.length} Officers created`);

    // ==========================================
    // Create Students
    // ==========================================

    const createdStudents = [];

    for (const student of students) {
      const createdStudent = await User.create(student);
      createdStudents.push(createdStudent);
    }

    console.log(`✅ ${createdStudents.length} Students created`);

    // ==========================================
    // Officer Lookup
    // department name -> officer ObjectId
    // ==========================================

    const officerMap = {};

    for (const officer of createdOfficers) {
      officerMap[officer.department] = officer._id;
    }

    // ==========================================
    // Helpers
    // ==========================================

    const setDepartmentStatus = (department, status, options = {}) => {
      department.status = status;

      if (status === "cleared") {
        department.clearedAt = new Date();
      }

      if (status === "requested") {
        department.requestedAt = new Date();
      }

      if (options.officerReason) {
        department.officerReason = options.officerReason;
      }

      if (options.studentResponse !== undefined) {
        department.studentResponse = options.studentResponse;
      }

      if (options.studentRespondedAt) {
        department.studentRespondedAt = options.studentRespondedAt;
      }
    };

    const getDepartment = (clearance, sno) =>
      clearance.departments.find((department) => department.sno === sno);

    // ==========================================
    // Create Clearance Records
    // ==========================================

    let createdClearances = 0;

    for (const student of createdStudents) {
      const clearance = new Clearance({
        student: student._id,
      });

      // Assign correct officer to every department

      clearance.departments = clearance.departments.map((department) => ({
        ...department.toObject(),
        officerId: officerMap[department.name] || null,
      }));

      // ==========================================
      // Student-specific mock data continues
      // in Part 4
      // ==========================================
      // ==========================================
      // Wanjiku Otieno
      // ==========================================

      if (student.admNo === "ADM/2024/087") {
        setDepartmentStatus(getDepartment(clearance, 1), "cleared");
        setDepartmentStatus(getDepartment(clearance, 2), "cleared");
        setDepartmentStatus(getDepartment(clearance, 3), "cleared");
        setDepartmentStatus(getDepartment(clearance, 4), "cleared");

        setDepartmentStatus(getDepartment(clearance, 5), "rejected", {
          officerReason:
            "You have not returned the sports jersey issued in 2023",
          studentResponse:
            "I returned it to Mr. Otieno on 12th March, please verify",
          studentRespondedAt: new Date(),
        });

        setDepartmentStatus(getDepartment(clearance, 6), "cleared");
        setDepartmentStatus(getDepartment(clearance, 7), "cleared");
        setDepartmentStatus(getDepartment(clearance, 8), "cleared");

        setDepartmentStatus(getDepartment(clearance, 9), "summoned", {
          officerReason:
            "Please come with your original receipt for the equipment borrowed in semester 3",
          studentResponse: "",
        });

        setDepartmentStatus(getDepartment(clearance, 10), "requested");
      }

      // ==========================================
      // Brian Kamau
      // ==========================================

      if (student.admNo === "ADM/2024/041") {
        setDepartmentStatus(getDepartment(clearance, 1), "cleared");
        setDepartmentStatus(getDepartment(clearance, 2), "cleared");
        setDepartmentStatus(getDepartment(clearance, 3), "cleared");
        setDepartmentStatus(getDepartment(clearance, 4), "requested");
      }

      // ==========================================
      // Aisha Mohamed
      // ==========================================

      if (student.admNo === "ADM/2024/112") {
        for (let sno = 1; sno <= 14; sno++) {
          setDepartmentStatus(getDepartment(clearance, sno), "cleared");
        }
      }

      // ==========================================
      // Collins Mwangi
      // ==========================================

      if (student.admNo === "ADM/2024/033") {
        setDepartmentStatus(getDepartment(clearance, 1), "requested");
      }

      // ==========================================
      // Fatuma Hassan
      // ==========================================
      // All departments remain pending

      // ==========================================
      // David Ochieng
      // ==========================================

      if (student.admNo === "ADM/2024/055") {
        for (let sno = 1; sno <= 5; sno++) {
          setDepartmentStatus(getDepartment(clearance, sno), "cleared");
        }

        setDepartmentStatus(getDepartment(clearance, 6), "rejected", {
          officerReason:
            "You have 2 unreturned books: Introduction to C++ and Database Systems",
          studentResponse: "",
        });
      }

      await clearance.save();
      createdClearances++;
    }

    console.log(`✅ ${createdClearances} Clearance records created`);
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("\n❌ Error seeding database:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    } catch (error) {
      console.error("Error disconnecting MongoDB:", error);
    }

    process.exit();
  }
};

seedDatabase();
