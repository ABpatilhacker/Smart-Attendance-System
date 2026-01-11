function logout(){auth.signOut().then(()=>location.href='index.html');}

function showClasses(){
  const content = document.getElementById('content');
  const uid = auth.currentUser.uid;
  database.ref('teachers/'+uid+'/classes').once('value').then(snap=>{
    content.innerHTML = '<h2>Your Classes</h2><ul id="class-list"></ul>';
    const ul = document.getElementById('class-list');
    snap.forEach(c=>{
      const li = document.createElement('li');
      li.innerHTML = c.key + ` <button class="btn primary" onclick="markAttendance('${c.key}')">Mark Attendance</button>`;
      ul.appendChild(li);
    });
  });
}

function markAttendance(className){
  const studentsRef = database.ref('classes/'+className+'/students');
  studentsRef.once('value').then(snap=>{
    let html = `<h2>${className} Attendance</h2><ul>`;
    snap.forEach(s=>{
      html += `<li>${s.key}: <button class="btn present" onclick="setAttendance('${className}','${s.key}','present',this)">Present</button> <button class="btn absent" onclick="setAttendance('${className}','${s.key}','absent',this)">Absent</button></li>`;
    });
    html+='</ul>';
    document.getElementById('content').innerHTML = html;
  });
}

function setAttendance(className, studentUID, status, btn){
  database.ref('students/'+studentUID+'/attendance/'+className+'/'+new Date().toISOString().split('T')[0]).set(status);
  alert('Marked '+status);
}
