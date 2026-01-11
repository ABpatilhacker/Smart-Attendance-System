const roleParam = new URLSearchParams(window.location.search).get("role");
if(roleParam) document.getElementById('role-title').textContent = `Login / Sign Up as ${roleParam.charAt(0).toUpperCase() + roleParam.slice(1)}`;

document.getElementById('login-btn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email,password)
  .then(cred => {
    const uid = cred.user.uid;
    database.ref('users/' + uid).once('value').then(snap => {
      if(!snap.exists()) { alert("Role not assigned! Contact Admin."); return; }
      const role = snap.val().role;
      if(role === 'admin') location.href='admin.html';
      else if(role === 'teacher') location.href='teacher.html';
      else location.href='student.html';
    });
  })
  .catch(err=>alert(err.message));
});

document.getElementById('signup-btn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if(!roleParam) { alert("Open Sign-up with role selection"); return; }

  auth.createUserWithEmailAndPassword(email,password)
  .then(cred=>{
    const uid = cred.user.uid;
    database.ref('users/' + uid).set({email:email, role:roleParam, approved:false});
    alert("Sign-up successful! Waiting admin approval.");
  })
  .catch(err=>alert(err.message));
});
