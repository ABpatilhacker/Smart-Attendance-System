// login.js

// Firebase auth login
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((result) => {
      const uid = result.user.uid;

      // 🔥 IMPORTANT: only ONE path → users/{uid}
      firebase.database().ref("users/" + uid).once("value")
        .then((snapshot) => {

          if (!snapshot.exists()) {
            alert("User record not found in database");
            firebase.auth().signOut();
            return;
          }

          const user = snapshot.val();

          // ✅ APPROVAL CHECK (BOOLEAN ONLY)
          if (user.approved !== true) {
            alert("Your account is not approved by admin");
            firebase.auth().signOut();
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
            alert("Invalid user role");
            firebase.auth().signOut();
          }
        });
    })
    .catch((error) => {
      alert(error.message);
    });
}
