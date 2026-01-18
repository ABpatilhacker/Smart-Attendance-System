const loginBox = document.getElementById("loginBox");
const signupBox = document.getElementById("signupBox");
const tabs = document.querySelectorAll(".tabs button");

function showLogin() {
  loginBox.classList.remove("hidden");
  signupBox.classList.add("hidden");
  tabs[0].classList.add("active");
  tabs[1].classList.remove("active");
}

function showSignup() {
  signupBox.classList.remove("hidden");
  loginBox.classList.add("hidden");
  tabs[1].classList.add("active");
  tabs[0].classList.remove("active");
}

/* LOGIN */
loginBox.addEventListener("submit", e => {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      const uid = res.user.uid;

      return db.ref("users/" + uid).once("value");
    })
    .then(snapshot => {
      if (!snapshot.exists()) {
        alert("User data not found");
        auth.signOut();
        return;
      }

      const user = snapshot.val();

      if (!user.approved) {
        alert("Waiting for admin approval");
        auth.signOut();
        return;
      }

      if (user.role === "admin") location.href = "admin.html";
      else if (user.role === "teacher") location.href = "teacher.html";
      else location.href = "student.html";
    })
    .catch(() => alert("Invalid email or password"));
});

/* SIGNUP */
function signup() {
  auth.createUserWithEmailAndPassword(
    signupEmail.value,
    signupPassword.value
  )
  .then(res => {
    return db.ref("users/" + res.user.uid).set({
      name: signupName.value,
      email: signupEmail.value,
      role: signupRole.value,
      approved: false
    });
  })
  .then(() => {
    alert("Signup successful! Wait for admin approval.");
    showLogin();
  })
  .catch(err => alert(err.message));
}
