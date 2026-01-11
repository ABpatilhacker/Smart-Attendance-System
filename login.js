let isSignup = false;

function toggleForm(){
  isSignup = !isSignup;

  document.getElementById("title").innerText = isSignup ? "Sign Up" : "Login";
  document.getElementById("login-btn").style.display = isSignup ? "none" : "block";
  document.getElementById("signup-btn").style.display = isSignup ? "block" : "none";

  document.getElementById("name").style.display = isSignup ? "block" : "none";
  document.getElementById("role").style.display = isSignup ? "block" : "none";

  document.getElementById("toggle-text").innerText =
    isSignup ? "Already have an account?" : "New user?";
}

// 🔐 LOGIN
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const selectedRole = localStorage.getItem("loginRole");

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      firebase.database().ref("users/" + uid).once("value")
        .then(snapshot => {
          if (!snapshot.exists()) {
            alert("Role not assigned. Contact admin.");
            return;
          }

          const data = snapshot.val();

          if (data.status !== "approved") {
            alert("Account pending admin approval");
            return;
          }

          if (data.role !== selectedRole) {
            alert("Wrong role selected");
            return;
          }

          if (data.role === "admin") location.href = "admin.html";
          if (data.role === "teacher") location.href = "teacher.html";
          if (data.role === "student") location.href = "student.html";
        });
    })
    .catch(err => alert(err.message));
});

// 🆕 SIGN UP
document.getElementById("signup-btn").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      // Save user info in database
      firebase.database().ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: "pending"   // admin must approve
      });

      alert("Signup successful! Wait for admin approval.");
      toggleForm();
    })
    .catch(err => alert(err.message));
});
