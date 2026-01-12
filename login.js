console.log("login.js loaded");

// ====== Firebase references ======
const auth = firebase.auth();
const database = firebase.database();

// ===== LOGIN =====
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

      // Check user role and approval
      database.ref("users/" + uid).once("value")
        .then((snap) => {
          if (!snap.exists()) {
            alert("User not found. Please Sign Up first.");
            return;
          }

          const userData = snap.val();

          if (userData.status && userData.status === "pending") {
            alert("Your account is pending admin approval. Please wait.");
            auth.signOut();
            return;
          }

          // Redirect based on role
          const role = userData.role;
          if (role === "admin") location.href = "admin.html";
          else if (role === "teacher") location.href = "teacher.html";
          else if (role === "student") location.href = "student.html";
          else alert("Invalid role. Contact admin.");
        });
    })
    .catch((err) => {
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please Sign Up first.");
      } else {
        alert(err.message);
      }
    });
});

// ===== SIGN UP =====
document.getElementById("signup-btn").addEventListener("click", () => {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const role = document.getElementById("signup-role").value;

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  // Create user in Firebase Authentication
  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // Save user data in Realtime Database with pending status
      database.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: "pending" // Admin approval
      });

      alert("Sign Up successful! Wait for admin approval before login.");
      
      // Switch back to login tab
      document.getElementById('login-tab').click();
    })
    .catch((err) => {
      alert(err.message);
    });
});
