const chat = document.getElementById("chat");
const input = document.getElementById("message");
const historyBox = document.getElementById("history");
const sendButton = document.getElementById("send");

let messages = [];

input.addEventListener("keydown", function (event) {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendMessage();

  }

});


async function sendMessage() {

  const text = input.value.trim();

  if (!text || sendButton.disabled) {
    return;
  }

  addMessage(text, "user");

  messages.push({
    role: "user",
    content: text
  });

  addHistory(text);

  input.value = "";

  const thinking = addMessage(
    "MORVIX AI está pensando...",
    "ai"
  );

  sendButton.disabled = true;

  try {

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          messages: messages
        })
      }
    );

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {

      throw new Error(
        data.error || "Error del servidor"
      );

    }

    addMessage(
      data.answer,
      "ai"
    );

    messages.push({

      role: "assistant",

      content: data.answer

    });

  } catch (error) {

    thinking.remove();

    addMessage(
      "❌ MORVIX AI no pudo conectarse con el servidor. Revisa la configuración de Render.",
      "ai"
    );

    console.error(error);

  }

  sendButton.disabled = false;

  input.focus();

}


function addMessage(text, type) {

  const message =
    document.createElement("div");

  message.className =
    "message " + type;

  const icon =
    document.createElement("div");

  icon.className =
    "message-icon " +
    (
      type === "user"
        ? "user-icon"
        : "ai-icon"
    );

  icon.textContent =
    type === "user"
      ? "M"
      : "✦";

  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;

  message.appendChild(icon);

  message.appendChild(content);

  chat.appendChild(message);

  chat.scrollTop =
    chat.scrollHeight;

  return message;

}


function addHistory(text) {

  const item =
    document.createElement("div");

  item.className =
    "history-item";

  item.textContent =
    text;

  historyBox.prepend(item);

}


function suggest(text) {

  input.value = text;

  input.focus();

}


function newChat() {

  messages = [];

  chat.innerHTML = `

    <div class="welcome">

      <div class="big-logo">
        ✦
      </div>

      <h1>
        ¿En qué puedo ayudarte?
      </h1>

      <p>
        Pregunta, aprende, crea y descubre
        con MORVIX AI.
      </p>

      <div class="suggestions">

        <button onclick="suggest('Explícame qué es la inteligencia artificial')">
          🧠 Explícame algo
        </button>

        <button onclick="suggest('Dame ideas para ganar dinero por internet')">
          💰 Dame ideas
        </button>

        <button onclick="suggest('Ayúdame a crear una página web')">
          💻 Crear una web
        </button>

        <button onclick="suggest('Ayúdame con una tarea escolar')">
          📚 Ayúdame a estudiar
        </button>

      </div>

    </div>

  `;

  input.focus();

}


function clearChat() {

  newChat();

}


function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

}


function toggleSidebar() {

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

}


function showAbout() {

  alert(
    "MORVIX AI\n\n" +
    "Asistente de inteligencia artificial."
  );

}
