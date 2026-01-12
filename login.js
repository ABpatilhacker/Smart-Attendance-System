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

const auth = firebase.auth();
const db = firebase.database();

// 🔐 LOGIN
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      // 🔎 FETCH ROLE FROM DATABASE
      db.ref("users/" + uid).once("value")
        .then((snapshot) => {
          const data = snapshot.val();

          if (!data || !data.role) {
            alert("Role not assigned!");
            return;
          }

          // 🚀 ROLE BASED REDIRECT
          if (data.role === "admin") {
            window.location.href = "admin.html";
          }
          else if (data.role === "teacher") {
            window.location.href = "teacher.html";
          }
          else if (data.role === "student") {
            window.location.href = "student.html";
          }
          else {
            alert("Invalid role");
          }
        });
    })
    .catch((error) => {
      alert(error.message);
    });
});
document.getElementById("signup-btn").addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const role = document.getElementById("signup-role").value;

  if (!email || !password || !role) {
    alert("Fill all fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      // 💾 SAVE ROLE IN DATABASE
      db.ref("users/" + uid).set({
        email: email,
        role: role
      });

      alert("Account created successfully");
      showLogin();
    })
    .catch((error) => {
      alert(error.message);
    });
});
