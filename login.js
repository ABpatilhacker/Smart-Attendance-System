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
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// Toggle Tabs
function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginTab").classList.add("active-tab");
  document.getElementById("signupTab").classList.remove("active-tab");
}

function showSignup() {
  document.getElementById("signupForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupTab").classList.add("active-tab");
  document.getElementById("loginTab").classList.remove("active-tab");
}

// LOGIN
function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  if (!email || !password) return alert("Enter email and password");

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;
      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) return alert("No user record found!");
        const user = snap.val();
        if (!user.approved) {
          auth.signOut();
          return alert("Your account is not approved by admin yet.");
        }

        // Redirect based on role
        if (user.role === "admin") window.location.href = "admin.html";
        else if (user.role === "teacher") window.location.href = "teacher.html";
        else if (user.role === "student") window.location.href = "student.html";
        else alert("Role not recognized.");
      });
    })
    .catch(err => alert("Invalid login credentials!"));
}

// SIGNUP
function signupUser() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  if (!name || !email || !password) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;
      db.ref("users/" + uid).set({
        name,
        email,
        role: "student",
        approved: false
      });
      alert("Signup successful! Wait for admin approval.");
      showLogin();
    })
    .catch(err => alert(err.message));
}
