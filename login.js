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


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Login logic
document.getElementById("login-btn").addEventListener("click", function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("error-msg");

  if (!email || !password) {
    errorMsg.innerText = "Please enter email and password";
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      return firebase.database().ref("users/" + uid).once("value");
    })
    .then((snapshot) => {
      if (!snapshot.exists()) {
        errorMsg.innerText = "User role not found";
        return;
      }

      const role = snapshot.val().role;

      if (role === "admin") window.location.href = "admin.html";
      else if (role === "teacher") window.location.href = "teacher.html";
      else if (role === "student") window.location.href = "student.html";
      else errorMsg.innerText = "Invalid role";
    })
    .catch((error) => {
      errorMsg.innerText = error.message;
    });
});
