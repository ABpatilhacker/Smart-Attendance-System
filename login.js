/* ==========================
   FIREBASE CONFIG
========================== */
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

/* ==========================
   UI TOGGLE
========================== */
function showLogin() {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginTab.classList.add("active-tab");
  signupTab.classList.remove("active-tab");
}

function showSignup() {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  signupTab.classList.add("active-tab");
  loginTab.classList.remove("active-tab");
}

/* ==========================
   LOGIN (WITH APPROVAL)
========================== */
loginForm.addEventListener("submit", e => {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("Account data not found");
          auth.signOut();
          return;
        }

        const user = snap.val();

        if (!user.approved) {
          alert("Your account is not approved by admin yet.");
          auth.signOut();
          return;
        }

        // ROLE REDIRECT
        if (user.role === "admin") location.href = "admin.html";
        else if (user.role === "teacher") location.href = "teacher.html";
        else if (user.role === "student") location.href = "student.html";
        else alert("Invalid role");
      });
    })
    .catch(() => alert("Invalid email or password"));
});

/* ==========================
   SIGNUP (WAIT FOR APPROVAL)
========================== */
signupForm.addEventListener("submit", e => {
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
        role,
        approved: false
      });
    })
    .then(() => {
      alert("Signup successful! Please wait for admin approval.");
      auth.signOut(); // IMPORTANT
      showLogin();
    })
    .catch(err => alert(err.message));
});
