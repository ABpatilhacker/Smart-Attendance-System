let isSignup = false;

function toggle() {
  isSignup = !isSignup;

  document.getElementById("title").innerText = isSignup ? "Sign Up" : "Login";
  document.getElementById("name").style.display = isSignup ? "block" : "none";
  document.getElementById("role").style.display = isSignup ? "block" : "none";

  document.querySelector("button").innerText = isSignup ? "Sign Up" : "Login";
  document.querySelector(".toggle").innerText =
    isSignup ? "Already have an account?" : "Create new account";
}

function submit() {
  const email = emailInput();
  const password = passwordInput();

  if (isSignup) signup(email, password);
  else login(email, password);
}

function signup(email, password) {
  const name = document.getElementById("name").value;
  const role = document.getElementById("role").value;

  if (!name || !role) {
    alert("Fill all fields");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(res => {
      return firebase.database().ref("users/" + res.user.uid).set({
        name,
        email,
        role
      });
    })
    .then(() => {
      alert("Account created. Please login.");
      toggle();
    })
    .catch(err => alert(err.message));
}

function login(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(res => {
      return firebase.database().ref("users/" + res.user.uid).once("value");
    })
    .then(snap => {
      const role = snap.val().role;

      if (role === "admin") location.href = "admin.html";
      else if (role === "teacher") location.href = "teacher.html";
      else location.href = "student.html";
    })
    .catch(err => alert(err.message));
}

function emailInput() {
  return document.getElementById("email").value;
}
function passwordInput() {
  return document.getElementById("password").value;
}
