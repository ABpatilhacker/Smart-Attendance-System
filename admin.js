function logout(){auth.signOut().then(()=>location.href='index.html');}

// TEACHERS
function showTeachers(){
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>Teachers</h2>
    <input id="tname" placeholder="Name"><input id="temail" placeholder="Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacher-list"></ul>`;
  loadTeachers();
}

function addTeacher(){
  const name = document.getElementById('tname').value;
  const email = document.getElementById('temail').value;
  const newRef = database.ref('users').push();
  newRef.set({email:email,role:'teacher',approved:true});
  database.ref('teachers/'+newRef.key).set({name:name,classes:{}});
  alert('Teacher Added!'); loadTeachers();
}

function loadTeachers(){
  const list = document.getElementById('teacher-list');
  if(!list) return;
  list.innerHTML='';
  database.ref('teachers').once('value').then(snap=>{
    snap.forEach(t=>{
      const li = document.createElement('li'); li.textContent = t.val().name + ' ('+t.key+')';
      list.appendChild(li);
    });
  });
}

// STUDENTS
function showStudents(){
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>Students</h2>
    <input id="sname" placeholder="Name"><input id="semail" placeholder="Email">
    <button class="btn primary" onclick="addStudent()">Add Student</button>
    <ul id="student-list"></ul>`;
  loadStudents();
}

function addStudent(){
  const name = document.getElementById('sname').value;
  const email = document.getElementById('semail').value;
  const newRef = database.ref('users').push();
  newRef.set({email:email,role:'student',approved:true});
  database.ref('students/'+newRef.key).set({name:name,attendance:{}});
  alert('Student Added!'); loadStudents();
}

function loadStudents(){
  const list = document.getElementById('student-list'); if(!list) return;
  list.innerHTML='';
  database.ref('students').once('value').then(snap=>{
    snap.forEach(s=>{
      const li = document.createElement('li'); li.textContent = s.val().name + ' ('+s.key+')';
      list.appendChild(li);
    });
  });
}

// CLASSES
function showClasses(){
  const content = document.getElementById('content');
  content.innerHTML = `<h2>Classes</h2>
    <input id="cname" placeholder="Class Name"><input id="cteach" placeholder="Teacher UID">
    <button class="btn primary" onclick="addClass()">Add Class</button>
    <ul id="class-list"></ul>`;
  loadClasses();
}

function addClass(){
  const cname = document.getElementById('cname').value;
  const teacherUID = document.getElementById('cteach').value;
  database.ref('classes/'+cname).set({teacher:teacherUID,students:{}});
  database.ref('teachers/'+teacherUID+'/classes/'+cname).set(true);
  alert('Class Added!'); loadClasses();
}

function loadClasses(){
  const list = document.getElementById('class-list'); if(!list) return;
  list.innerHTML='';
  database.ref('classes').once('value').then(snap=>{
    snap.forEach(c=>{
      const li = document.createElement('li'); li.textContent = c.key + ' ('+c.val().teacher+')';
      list.appendChild(li);
    });
  });
}
