const signupBtn = document.getElementById('signup-btn');

signupBtn.addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  if(!name || !email || !password || !role) return alert("Fill all fields!");

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const uid = userCredential.user.uid;
      // Store in "pending" node for admin approval
      firebase.database().ref('pending/' + uid).set({
        name,
        email,
        role
      });
      alert("Sign up successful! Wait for Admin approval.");
      location.href="index.html";
    })
    .catch(err => alert(err.message));
});
