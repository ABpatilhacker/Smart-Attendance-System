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

function login() {
  const email = login-email.value.trim();
  const password = login-password.value.trim();

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      firebase.database().ref("users/" + uid).once("value")
        .then(snap => {
          if (!snap.exists()) {
            alert("Account not approved by admin");
            return;
          }

          const role = snap.val().role;

          if (role === "admin") location.href = "admin.html";
          else if (role === "teacher") location.href = "teacher.html";
          else location.href = "student.html";
        });
    })
    .catch(err => alert(err.message));
}
