const chat = document.getElementById("chat");
const input = document.getElementById("message");
const historyBox = document.getElementById("history");
const sendButton = document.getElementById("send");

let messages = [];

// Enter para enviar
input.addEventListener("keydown", function (event) {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendMessage();

  }

});


// ENVIAR MENSAJE
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

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        messages: messages
      })

    });


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
      "❌ MORVIX AI no pudo conectarse con la IA.",
      "ai"
    );

    console.error("Error:", error);

  }


  sendButton.disabled = false;

  input.focus();

}


// CREAR MENSAJE
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


// HISTORIAL
function addHistory(text) {

  const item =
    document.createElement("div");

  item.className =
    "history-item";

  item.textContent =
    text;

  historyBox.prepend(item);

}


// SUGERENCIAS
function suggest(text) {

  input.value = text;

  input.focus();

}


// NUEVO CHAT
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


// BORRAR CHAT
function clearChat() {

  newChat();

}


// CAMBIAR TEMA
function toggleTheme() {

  document.body.classList.toggle("dark");

}


// ABRIR SIDEBAR
function toggleSidebar() {

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

}


// CONFIGURACIÓN
function showAbout() {

  alert(
    "MORVIX AI\n\n" +
    "Asistente de inteligencia artificial."
  );

}
