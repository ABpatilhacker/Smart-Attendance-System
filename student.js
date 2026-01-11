function logout(){auth.signOut().then(()=>location.href='index.html');}

function showAttendance(){
  const uid = auth.currentUser.uid;
  const content = document.getElementById('content');
  database.ref('students/'+uid+'/attendance').once('value').then(snap=>{
    let html = '<h2>My Attendance</h2><ul>';
    snap.forEach(cls=>{
      html += `<li>${cls.key}: `;
      cls.forEach(date=>{
        html += `${date.key}: ${date.val()} | `;
      });
      html+='</li>';
    });
    html+='</ul>';
    content.innerHTML = html;
  });
}
