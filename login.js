// Firebase config (YOUR SAME CONFIG)
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

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      return db.ref("users/" + uid).once("value");
    })
    .then(snap => {
      if (!snap.exists()) {
        alert("No user data found");
        auth.signOut();
        return;
      }

      const user = snap.val();

      if (!user.approved) {
        alert("Your account is not approved by admin");
        auth.signOut();
        return;
      }

      // REDIRECT BY ROLE
      if (user.role === "admin") {
        window.location.href = "admin.html";
      } else if (user.role === "teacher") {
        window.location.href = "teacher.html";
      } else if (user.role === "student") {
        window.location.href = "student.html";
      } else {
        alert("Invalid role");
        auth.signOut();
      }
    })
    .catch(err => {
      alert("Invalid email or password");
      console.error(err);
    });
});
