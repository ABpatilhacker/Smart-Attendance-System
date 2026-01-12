console.log("login.js loaded");

/* =======================
   FIREBASE INITIALIZATION
======================= */
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

// Prevent re-initialization error
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

/* =======================
   DOM READY
======================= */
document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     LOGIN
  ======================= */
  const loginBtn = document.getElementById("login-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }

      auth.signInWithEmailAndPassword(email, password)
        .then((cred) => {
          const uid = cred.user.uid;
          return db.ref("users/" + uid).once("value");
        })
        .then((snap) => {
          if (!snap.exists()) {
            alert("Role not assigned. Contact admin.");
            auth.signOut();
            return;
          }

          const role = snap.val().role;

          if (role === "admin") {
            window.location.href = "admin.html";
          } else if (role === "teacher") {
            window.location.href = "teacher.html";
          } else if (role === "student") {
            window.location.href = "student.html";
          } else {
            alert("Invalid role");
          }
        })
        .catch((err) => {
          alert(err.message);
        });
    });
  }

  /* =======================
     SIGN UP
  ======================= */
  const signupBtn = document.getElementById("signup-btn");

  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value.trim();
      const role = document.getElementById("signup-role").value;

      if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
      }

      auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
          const uid = cred.user.uid;

          return db.ref("users/" + uid).set({
            name: name,
            email: email,
            role: role,        // student / teacher
            status: "active"   // you can change to "pending" later
          });
        })
        .then(() => {
          alert("Signup successful. You can login now.");
          location.reload();
        })
        .catch((err) => {
          alert(err.message);
        });
    });
  }

});
