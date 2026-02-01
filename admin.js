/******** FIREBASE ********/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/******** AUTH ********/
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  else {
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadApprovals();
    loadSettings();
  }
});

/******** NAV ********/
function nav(id, btn){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar nav button")
    .forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  closeSidebar();
}

/******** SIDEBAR ********/
function toggleSidebar(){ document.body.classList.toggle("sidebar-open"); }
function closeSidebar(){ document.body.classList.remove("sidebar-open"); }

/******** DASHBOARD ********/
function loadDashboard(){
  db.ref("classes").on("value", s=>classCount.innerText=s.numChildren());
  db.ref("users").on("value", s=>{
    let t=0,st=0;
    s.forEach(u=>{
      if(u.val().approved){
        if(u.val().role==="teacher") t++;
        if(u.val().role==="student") st++;
      }
    });
    teacherCount.innerText=t;
    studentCount.innerText=st;
  });
}

/******** LOGOUT ********/
function logout(){
  auth.signOut().then(()=>location.href="login.html");
}
