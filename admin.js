// ---------- GLOBAL ----------
const auth = window.auth;
const db = window.db;

// ---------- CREATE CLASS ----------
function createClass() {
  const className = document.getElementById("className").value.trim();
  const subjectsInput = document.getElementById("subjects").value.trim();
  const status = document.getElementById("status");

  if (!className || !subjectsInput) {
    status.innerText = "❌ Please enter class name and subjects";
    return;
  }

  // Convert subjects to object
  const subjectsArray = subjectsInput.split(",");
  const subjectsObj = {};

  subjectsArray.forEach((sub, index) => {
    subjectsObj["sub" + (index + 1)] = sub.trim();
  });

  // Create unique class ID
  const classId = db.ref("classes").push().key;

  // Save to Firebase
  db.ref(`classes/${classId}`).set({
    name: className,
    subjects: subjectsObj,
    teachers: {},
    students: {},
    attendance: {}
  })
  .then(() => {
    status.innerText = "✅ Class created successfully!";
    document.getElementById("className").value = "";
    document.getElementById("subjects").value = "";
  })
  .catch(err => {
    status.innerText = "❌ Error: " + err.message;
  });
}
