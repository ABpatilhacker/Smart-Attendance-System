// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// LOGIN FUNCTION
function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) return alert("Enter email & password");

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("User not found in database");
          auth.signOut();
          return;
        }

        const user = snap.val();

        if (!user.approved) {
          alert("Your account is not approved by admin yet.");
          auth.signOut();
          return;
        }

        // Redirect based on role
        if (user.role === "admin") {
          window.location.href = "admin.html";
        } else if (user.role === "teacher") {
          window.location.href = "teacher.html";
        } else if (user.role === "student") {
          window.location.href = "student.html";
        } else {
          alert("Invalid role!");
          auth.signOut();
        }
      });
    })
    .catch(err => {
      console.error(err);
      alert("Invalid login credentials");
    });
}

// SIGNUP FUNCTION
function signupUser() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!name || !email || !password) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      // Add user to database with approved = false
      db.ref("users/" + uid).set({
        name: name,
        email: email,
        role: "student", // Signup always creates student
        approved: false,
        classId: "", // Can be updated later by admin
        roll: ""
      });

      alert("Signup successful! Wait for admin approval to login.");
      // Switch to login tab
      document.getElementById("loginTab").click();
    })
    .catch(err => {
      console.error(err);
      alert(err.message);
    });
}

