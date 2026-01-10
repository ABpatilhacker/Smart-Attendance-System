const loginBtn = document.getElementById('login-btn');
loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      // Redirect based on role
      firebase.database().ref('users/' + uid).once('value').then(snap => {
        const role = snap.val().role;
        if(role === 'admin') location.href='admin.html';
        else if(role === 'teacher') location.href='teacher.html';
        else location.href='student.html';
      });
    })
    .catch((error) => {
      alert(error.message);
    });
});
