function showDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Student Dashboard</h2>
    <p>Overview of attendance</p>
  `;
}

function viewAttendance() {
  document.getElementById("content").innerHTML = `
    <h2>Your Attendance</h2>
    <p>75% Present</p>
  `;
}
