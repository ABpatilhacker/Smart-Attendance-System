// ===============================
// FIREBASE INIT (DO NOT CHANGE)
// ===============================
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// ===============================
// TAB SWITCHING
// ===============================
function showLogin() {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("signupBox").classList.add("hidden");
}

function showSignup() {
  document.getElementById("signupBox").classList.remove("hidden");
  document.getElementById("loginBox").classList.add("hidden");
}

// ===============================
// LOGIN
// ===============================
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // FORCE READ VALUES (fix autofill issue)
  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPassword");

  emailInput.blur();
  passInput.blur();

  setTimeout(() => {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((cred) => {
        const uid = cred.user.uid;

        firebase.database().ref("users/" + uid).once("value")
          .then((snap) => {
            if (!snap.exists()) {
              alert("User record not found");
              firebase.auth().signOut();
              return;
            }

            const user = snap.val();

            if (!user.approved) {
              alert("Your account is not approved by admin yet");
              firebase.auth().signOut();
              return;
            }

            // REDIRECT BASED ON ROLE
            if (user.role === "admin") {
              window.location.href = "admin.html";
            } else if (user.role === "teacher") {
              window.location.href = "teacher.html";
            } else {
              window.location.href = "student.html";
            }
          });
      })
      .catch((error) => {
        alert(error.message);
      });
  }, 150); // IMPORTANT delay for mobile autofill
});

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("User data not found");
          auth.signOut();
          return;
        }

        const user = snap.val();

        if (!user.approved) {
          alert("Your account is not approved by admin yet");
          auth.signOut();
          return;
        }

        // REDIRECT BASED ON ROLE
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
      });
    })
    .catch(err => {
      alert(err.message);
    });
});

// ===============================
// SIGNUP
// ===============================
document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;

  if (!name || !email || !password || !role) {
    alert("Fill all signup fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      return db.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        approved: false
      });
    })
    .then(() => {
      alert("Signup successful! Wait for admin approval.");
      auth.signOut();
      showLogin();
      document.getElementById("signupForm").reset();
    })
    .catch(err => {
      alert(err.message);
    });
});
