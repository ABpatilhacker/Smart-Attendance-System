// ===== FIREBASE CONFIG =====
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

// ===== TOGGLE LOGIN/SIGNUP =====
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginLink = document.getElementById("loginLink");
const signupLink = document.getElementById("signupLink");

signupLink.onclick = () => { loginForm.classList.add("hidden"); signupForm.classList.remove("hidden"); }
loginLink.onclick = () => { signupForm.classList.add("hidden"); loginForm.classList.remove("hidden"); }

// ===== LOGIN =====
loginForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPassword");

  emailInput.blur();
  passInput.blur();

  setTimeout(() => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) return alert("Enter email and password");

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        db.ref("users/" + cred.user.uid).once("value").then(snap => {
          if (!snap.exists()) { alert("User record not found"); auth.signOut(); return; }
          const user = snap.val();

          if (!user.approved) {
            alert("Your account is not approved by admin yet");
            auth.signOut();
            return;
          }

          // Redirect based on role
          if (user.role === "admin") window.location.href = "admin.html";
          else if (user.role === "teacher") window.location.href = "teacher.html";
          else window.location.href = "student.html";
        });
      })
      .catch(err => alert(err.message));
  }, 150);
});

// ===== SIGNUP =====
signupForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;

  if (!name || !email || !password || !role) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      db.ref("users/" + cred.user.uid).set({
        name,
        email,
        role,
        approved: false // must be approved by admin
      });
      alert("Signup successful! Wait for admin approval.");
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    })
    .catch(err => alert(err.message));
});
