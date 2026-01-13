// login.js

function loginUser() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (email === "" || password === "") {
    alert("Fill all fields");
    return;
  }

  window.auth.signInWithEmailAndPassword(email, password)
    .then(function () {
      alert("Login successful");
      window.location.href = "admin.html";
    })
    .catch(function (error) {
      alert(error.message);
    });
}
