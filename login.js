// ==========================
// FIREBASE CONFIG
// ==========================
var const firebaseConfig = {
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

// ==========================
// UI TOGGLE
// ==========================
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

// ==========================
// LOGIN
// ==========================
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("User data not found");
          auth.signOut();
          return;
        }

        const role = snap.val().role;

        if (role === "admin") location.href = "admin.html";
        else if (role === "teacher") location.href = "teacher.html";
        else if (role === "student") location.href = "student.html";
        else alert("Invalid role");
      });
    })
    .catch(() => alert("Invalid email or password"));
});

// ==========================
// SIGNUP
// ==========================
document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = signupName.value;
  const email = signupEmail.value;
  const password = signupPassword.value;
  const role = signupRole.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      return db.ref("users/" + uid).set({
        name,
        email,
        role
      });
    })
    .then(() => {
      alert("Account created successfully! Please login.");
      showLogin();
    })
    .catch(err => alert(err.message));
});
