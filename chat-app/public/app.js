const myUsername = localStorage.getItem("username");

if (!myUsername) {
  alert("You must login first.");
  window.location.href = "/public/login.html";
}

const url = new URL(`/start_web_socket?username=${myUsername}`, location.origin);
url.protocol = url.protocol.replace("http", "ws");
const socket = new WebSocket(url);

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    switch (data.event) {
      case "update-users":
        updateUserList(data.usernames);
        break;
      case "send-message":
        addMessage(data.username, data.message);
        break;
      default:
        console.warn("Unknown event:", data.event);
    }
  } catch (e) {
    console.error("Invalid WebSocket message:", event.data);
  }
};

function updateUserList(usernames) {
  const userList = document.getElementById("users");
  userList.replaceChildren();

  for (const username of usernames) {
    const listItem = document.createElement("li");
    listItem.textContent = username;
    userList.appendChild(listItem);
  }
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

const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', function () {
  localStorage.clear();
  alert('Logout Successful');
  window.location.href = "/public/login.html";  
});