const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

const auth = firebase.auth();
const database = firebase.database();

// ===== LOGIN =====
loginBtn.addEventListener('click', () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) return alert("Please enter email and password");

  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      database.ref('users/' + uid).once('value').then(snap => {
        if (!snap.exists()) return alert("User not found. Contact admin");

        const data = snap.val();
        if(data.status !== 'approved') return alert("Wait for admin approval");

        if(data.role === "admin") location.href="admin.html";
        else if(data.role === "teacher") location.href="teacher.html";
        else if(data.role === "student") location.href="student.html";
        else alert("Invalid role");
      });
    })
    .catch(err => {
      if(err.code === 'auth/user-not-found') alert("User not found. Please Sign Up");
      else alert(err.message);
    });
});

// ===== SIGN UP =====
signupBtn.addEventListener('click', () => {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const role = document.getElementById('signup-role').value;

  if(!name || !email || !password) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      database.ref('users/' + uid).set({
        name,
        email,
        role,
        status:'pending'
      });

      alert("Signup successful! Wait for admin approval.");
    })
    .catch(err => alert(err.message));
});
