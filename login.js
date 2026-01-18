// ==========================
// FIREBASE CONFIG
// ==========================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ==========================
// TAB SWITCH
// ==========================
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

loginTab.onclick = () => {
  loginTab.classList.add("active-tab");
  signupTab.classList.remove("active-tab");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
};

signupTab.onclick = () => {
  signupTab.classList.add("active-tab");
  loginTab.classList.remove("active-tab");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
};

// ==========================
// LOGIN
// ==========================
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("Account not found!");
          auth.signOut();
          return;
        }

        const user = snap.val();
        if (!user.approved) {
          alert("Your account is not approved by Admin!");
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
});

// ==========================
// SIGNUP
// ==========================
signupForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      db.ref("users/" + uid).set({
        name,
        email,
        role: "student", // default signup is student
        approved: false,
        classId: "",
        roll: ""
      }).then(() => {
        alert("Signup successful! Wait for admin approval.");
        signupForm.reset();
        loginTab.click();
      });
    })
    .catch(err => alert(err.message));
});
