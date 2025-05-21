const myUsername = localStorage.getItem("username");

if (!myUsername) {
  alert("You must login first.");
  window.location.href = "/public/login.html";
}

const url = new URL(`/start_web_socket?username=${myUsername}`, location.origin);
url.protocol = url.protocol.replace("http", "ws");
const socket = new WebSocket(url);

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.event) {
    case "update-users":
      updateUserList(data.rooms);
      break;

    case "send-message":
      addMessage(data.username, data.message);
      break;

    case "clear-chat":
      clearChat();
      break;
  }
};

function clearChat() {
  const chatContainer = document.getElementById("conversation");
  chatContainer.innerHTML = "";
}

function updateUserList(rooms) {
  const roomListContainer = document.getElementById("room-list");
  roomListContainer.innerHTML = "";
  rooms.forEach((room) => {
    const roomTitle = document.createElement("h3");
    roomTitle.textContent = room.roomName;
    roomTitle.style.cursor = "pointer";
    roomTitle.addEventListener("click", () => {

      if (room.members.includes(myUsername)) {
        alert(`Kamu sudah ada di room "${room.roomName}", tidak bisa masuk lagi.`);
        return;
      }

      if (room.roomName === "Public Room") {
        socket.send(JSON.stringify({
          event: "join-room",
          roomName: room.roomName,
          username: myUsername,
        }));
        return;
      }

      const password = prompt(`Masukkan password untuk masuk ke room "${room.roomName}":`);
      if (password === null) {
        alert(`Password Kosong`);
        return;
      }

      socket.send(JSON.stringify({
        event: "join-room",
        roomName: room.roomName,
        roomPassword: password,
        username: myUsername,
      }));
    });

    roomListContainer.appendChild(roomTitle);

    const memberList = document.createElement("ul");

    if (room.members.length === 0) {
      const noMember = document.createElement("li");
      noMember.textContent = "(No members)";
      memberList.appendChild(noMember);
    }
    else {
      room.members.forEach((memberName) => {
        const memberItem = document.createElement("li");
        memberItem.textContent = memberName;
        memberList.appendChild(memberItem);
      });
    }

    roomListContainer.appendChild(memberList);
  });
}

function addMessage(username, message) {
  const template = document.getElementById("message");
  const clone = template.content.cloneNode(true);

  clone.querySelector("span").textContent = username;
  clone.querySelector("p").textContent = message;
  document.getElementById("conversation").prepend(clone);
}

const inputElement = document.getElementById("data");
inputElement.focus();

const form = document.getElementById("form");

form.onsubmit = (e) => {
  e.preventDefault();
  const message = inputElement.value;
  inputElement.value = "";
  socket.send(JSON.stringify({ event: "send-message", message }));
};

const createButton = document.getElementById("create-room-button");
const formContainer = document.getElementById("create-room-form-container");

createButton.addEventListener("click", () => {
  if (formContainer.children.length > 0) return;

  createButton.textContent = "Cancel";

  const form = document.createElement("form");

  form.innerHTML = `
    <input type="text" id="room-name" placeholder="Room name" required />
    <input type="password" id="room-password" placeholder="Password" required />
    <button type="submit">Create</button>
  `;

  formContainer.appendChild(form);

  form.onsubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById("room-name").value;
    const password = document.getElementById("room-password").value;

    socket.send(JSON.stringify({
      event: "create-private-room",
      roomName: name,
      password: password
    }));

    formContainer.innerHTML = "";
    createButton.textContent = "Create Private Room";
  };

  createButton.onclick = () => {
    formContainer.innerHTML = "";
    createButton.textContent = "Create Private Room";

    createButton.onclick = null;
    createButton.addEventListener("click", arguments.callee);
  };
});

const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', function () {
  localStorage.clear();
  alert('Logout Successful');
  window.location.href = "/public/login.html";  
});