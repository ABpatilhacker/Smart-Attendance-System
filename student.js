let studentId, studentData, classId;

auth.onAuthStateChanged(user=>{
  if(!user) location.href="login.html";
  studentId=user.uid;

  db.ref("users/"+studentId).once("value").then(snap=>{
    studentData=snap.val();
    classId=studentData.classId;

    document.getElementById("studentName").innerText =
      "👨‍🎓 " + studentData.name;
    document.getElementById("roll").innerText = studentData.roll;
    loadClass();
  });
});

function loadClass(){
  db.ref("classes/"+classId).once("value").then(c=>{
    document.getElementById("className").innerText = c.val().name;
    loadSubjects(c.val().subjects);
  });
}

function loadSubjects(subjects){
  const box=document.getElementById("subjects");
  box.innerHTML="";
  let totalP=0,totalT=0;

  Object.entries(subjects).forEach(([sid,name])=>{
    db.ref(`attendance/${classId}/${sid}`).once("value").then(a=>{
      let p=0,t=0;

      a.forEach(d=>{
        t++;
        if(d.val()[studentId]) p++;
      });

      totalP+=p;
      totalT+=t;

      const per=t?Math.round((p/t)*100):0;
      const div=document.createElement("div");
      div.className=`subject ${per<75?"warn":"good"}`;
      div.innerHTML=`
        <h4>${name}</h4>
        <p>${per}% Attendance</p>
      `;
      box.appendChild(div);

      document.getElementById("overall").innerText =
        totalT?Math.round((totalP/totalT)*100)+"%":"0%";
    });
  });

  loadHistory();
}

function loadHistory(){
  const box=document.getElementById("history");
  box.innerHTML="";

  db.ref(`attendance/${classId}`).once("value").then(snap=>{
    snap.forEach(sub=>{
      sub.forEach(date=>{
        const status=date.val()[studentId]?"Present":"Absent";
        box.innerHTML+=`
          <div class="history-item">
            <span>${date.key}</span>
            <span>${status}</span>
          </div>`;
      });
    });
  });
}

function logout(){
  auth.signOut();
  location.href="login.html";
}