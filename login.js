document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const msg = document.getElementById("login-msg");

  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      msg.innerText = "❌ Please enter email and password";
      msg.style.color = "red";
      return;
    }

    msg.innerText = "⏳ Logging in...";
    msg.style.color = "black";

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCred) => {
        const uid = userCred.user.uid;

        // Get role from database
        firebase.database().ref("users/" + uid).once("value")
          .then((snapshot) => {
            if (!snapshot.exists()) {
              msg.innerText = "❌ Account not found. Please sign up.";
              msg.style.color = "red";
              firebase.auth().signOut();
              return;
            }

            const data = snapshot.val();
            const role = data.role;

            if (!role) {
              msg.innerText = "❌ Role not assigned. Contact admin.";
              msg.style.color = "red";
              return;
            }

            // Redirect based on role
            if (role === "admin") {
              window.location.href = "admin.html";
            } 
            else if (role === "teacher") {
              window.location.href = "teacher.html";
            } 
            else if (role === "student") {
              window.location.href = "student.html";
            } 
            else {
              msg.innerText = "❌ Invalid role assigned";
              msg.style.color = "red";
            }
          });
      })
      .catch((error) => {
        if (error.code === "auth/user-not-found") {
          msg.innerText = "❌ User not found. Please sign up.";
        } else if (error.code === "auth/wrong-password") {
          msg.innerText = "❌ Incorrect password";
        } else {
          msg.innerText = "❌ " + error.message;
        }
        msg.style.color = "red";
      });
  });
});
