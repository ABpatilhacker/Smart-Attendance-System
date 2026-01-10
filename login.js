// Grab login button
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please enter email and password!");
    return;
  }

  // Sign in with Firebase Auth
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      // Check user role from Realtime Database
      database.ref('users/' + uid).once('value')
        .then(snap => {
          const data = snap.val();
          if (!data || !data.role) {
            alert("No role assigned! Contact admin.");
            return;
          }

          // Redirect based on role
          if (data.role === 'admin') {
            location.href = 'admin.html';
          } else if (data.role === 'teacher') {
            location.href = 'teacher.html';
          } else if (data.role === 'student') {
            location.href = 'student.html';
          } else {
            alert("Unknown role!");
          }
        });
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
});
