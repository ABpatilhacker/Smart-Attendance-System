const loginBtn = document.getElementById('login-btn');
loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if(!email || !password) return alert("Enter email and password!");

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      // Check role in database
      firebase.database().ref('users/' + uid).once('value')
        .then(snap => {
          if(snap.exists()){
            const role = snap.val().role;
            if(role === 'admin') location.href='admin.html';
            else if(role === 'teacher') location.href='teacher.html';
            else location.href='student.html';
          } else {
            alert("Role not assigned yet. Contact Admin!");
          }
        })
        .catch(err => alert("Database error: "+err.message));
    })
    .catch((error) => {
      if(error.code === "auth/user-not-found"){
        if(confirm("User not found. Do you want to Sign Up?")){
          location.href="signup.html"; // redirect to signup page
        }
      } else {
        alert(error.message);
      }
    });
});
