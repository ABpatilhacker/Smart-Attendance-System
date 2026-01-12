<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  // 🔹 Login button
  document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      // 🔹 Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 🔹 Get role from database
      const userRef = ref(db, "users/" + uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        alert("User role not found in database");
        return;
      }

      const role = snapshot.val().role;

      // 🔹 Redirect based on role
      if (role === "admin") {
        window.location.href = "admin.html";
      } else if (role === "teacher") {
        window.location.href = "teacher.html";
      } else if (role === "student") {
        window.location.href = "student.html";
      } else {
        alert("Invalid role");
      }

    } catch (error) {
      alert(error.message);
    }
  });
</script>
