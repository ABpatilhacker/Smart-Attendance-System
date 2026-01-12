console.log("login.js loaded");

// Firebase references
const auth = firebase.auth();
const database = firebase.database();

// LOGIN FUNCTION
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // Check if user exists in database
      database.ref("users/" + uid).once("value").then((snap) => {
        if (!snap.exists()) {
          alert("User not registered. Please sign up first.");
          return;
        }

        const data = snap.val();

        // Check admin approval
        if (data.status === "pending") {
          alert("Your account is pending approval from admin.");
          return;
        }

        // Redirect based on role
        if (data.role === "admin") location.href = "admin.html";
        else if (data.role === "teacher") location.href = "teacher.html";
        else if (data.role === "student") location.href = "student.html";
        else alert("Role not assigned. Contact admin.");
      });
    })
    .catch((err) => {
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please Sign Up first.");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else {
        alert(err.message);
      }
    });
});

// SIGNUP FUNCTION
document.getElementById("signup-btn").addEventListener("click", () => {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const role = document.getElementById("signup-role").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // Save user in database as pending
      database.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: "pending"  // admin approval required
      });

      alert("Signup successful! Wait for admin approval.");
      // Clear signup fields
      document.getElementById("signup-name").value = "";
      document.getElementById("signup-email").value = "";
      document.getElementById("signup-password").value = "";
    })
    .catch((err) => {
      alert(err.message);
    });
});

// TAB SWITCHING
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginBox = document.getElementById("login-box");
const signupBox = document.getElementById("signup-box");

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active-tab");
  signupTab.classList.remove("active-tab");
  loginBox.classList.remove("hidden");
  signupBox.classList.add("hidden");
});

signupTab.addEventListener("click", () => {
  signupTab.classList.add("active-tab");
  loginTab.classList.remove("active-tab");
  signupBox.classList.remove("hidden");
  loginBox.classList.add("hidden");
});
