// 🔥 Firebase Config (PUT YOUR REAL CONFIG HERE)
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

// Elements
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const toggleBtn = document.getElementById("toggle-btn");
const title = document.getElementById("form-title");
const errorMsg = document.getElementById("error-msg");

let isLogin = true;

// 🔁 TOGGLE FORM
toggleBtn.addEventListener("click", () => {
  isLogin = !isLogin;
  loginForm.classList.toggle("hidden");
  signupForm.classList.toggle("hidden");

  title.innerText = isLogin ? "Login" : "Sign Up";
  toggleBtn.innerText = isLogin ? "Create an account" : "Already have an account?";
  errorMsg.innerText = "";
});

// 🔐 LOGIN
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    errorMsg.innerText = "Fill all fields";
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;
      return firebase.database().ref("users/" + uid).once("value");
    })
    .then(snapshot => {
      const role = snapshot.val().role;

      if (role === "admin") location.href = "admin.html";
      else if (role === "teacher") location.href = "teacher.html";
      else if (role === "student") location.href = "student.html";
      else errorMsg.innerText = "Invalid role";
    })
    .catch(err => errorMsg.innerText = err.message);
});

// 🆕 SIGNUP
document.getElementById("signup-btn").addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const role = document.getElementById("signup-role").value;

  if (!email || !password || !role) {
    errorMsg.innerText = "Fill all fields";
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(res => {
      return firebase.database().ref("users/" + res.user.uid).set({
        email: email,
        role: role
      });
    })
    .then(() => {
      errorMsg.style.color = "#b2ffb2";
      errorMsg.innerText = "Account created! Please login.";
    })
    .catch(err => errorMsg.innerText = err.message);
});
