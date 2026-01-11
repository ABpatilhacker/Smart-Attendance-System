const auth = firebase.auth();
const database = firebase.database();

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

loginBtn.addEventListener('click', () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      database.ref('users/' + uid).once('value').then(snap => {
        const role = snap.val()?.role;
        if(!role) return alert('Role not assigned. Contact admin.');
        if(role === 'admin') location.href='admin.html';
        else if(role === 'teacher') location.href='teacher.html';
        else location.href='student.html';
      });
    })
    .catch(err => alert(err.message));
});

signupBtn.addEventListener('click', () => {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const role = document.getElementById('signup-role').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;
      // Add to database as pending
      database.ref('pending/' + uid).set({name, email, role});
      alert('Sign-up successful! Waiting admin approval.');
    })
    .catch(err => alert(err.message));
});
