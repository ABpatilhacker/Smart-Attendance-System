console.log("login.js loaded");

const auth = firebase.auth();
const db = firebase.database();

document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      return db.ref("users/" + uid).once("value");
    })
    .then((snapshot) => {

      if (!snapshot.exists()) {
        alert("User record not found. Contact admin.");
        auth.signOut();
        return;
      }

      const user = snapshot.val();

      // 🔴 CHECK ADMIN APPROVAL
      if (user.status !== "approved") {
        alert("Your account is not approved by admin yet.");
        auth.signOut();
        return;
      }

      // ✅ ROLE BASED REDIRECT
      if (user.role === "admin") {
        window.location.href = "admin.html";
      }
      else if (user.role === "teacher") {
        window.location.href = "teacher.html";
      }
      else if (user.role === "student") {
        window.location.href = "student.html";
      }
      else {
        alert("Invalid role assigned.");
        auth.signOut();
      }

    })
    .catch((error) => {
      if (error.code === "auth/user-not-found") {
        alert("User not found. Please Sign Up first.");
      } else if (error.code === "auth/wrong-password") {
        alert("Wrong password");
      } else {
        alert(error.message);
      }
    });
});
