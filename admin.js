// LOGOUT
function logout() {
  firebase.auth().signOut().then(() => {
    location.href = "index.html";
  });
}

// SHOW PENDING USERS
function showPending() {
  const content = document.getElementById("content");
  content.innerHTML = "<h3>Pending Approvals</h3><ul id='pending-list'></ul>";

  const list = document.getElementById("pending-list");

  firebase.database().ref("users").once("value").then(snapshot => {
    list.innerHTML = "";

    snapshot.forEach(userSnap => {
      const user = userSnap.val();

      if (user.status === "pending") {
        const li = document.createElement("li");

        li.innerHTML = `
          <span>
            <b>${user.name}</b><br>
            ${user.email} <br>
            Role: ${user.role}
          </span>
          <div>
            <button class="btn secondary" onclick="approveUser('${userSnap.key}')">Approve</button>
            <button class="btn danger" onclick="rejectUser('${userSnap.key}')">Reject</button>
          </div>
        `;

        list.appendChild(li);
      }
    });

    if (!list.hasChildNodes()) {
      list.innerHTML = "<p>No pending users 🎉</p>";
    }
  });
}

// APPROVE USER
function approveUser(uid) {
  firebase.database().ref("users/" + uid + "/status").set("approved")
    .then(() => {
      alert("User approved ✅");
      showPending();
    });
}

// REJECT USER
function rejectUser(uid) {
  if (!confirm("Reject this user?")) return;

  firebase.database().ref("users/" + uid).remove()
    .then(() => {
      alert("User rejected ❌");
      showPending();
    });
}
