function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(cred => {
      firebase.database().ref("users/" + cred.user.uid).set({
        name,
        email,
        role
      });
      alert("Signup successful! You can now login.");
      location.href = "login.html";
    })
    .catch(err => alert(err.message));
}
