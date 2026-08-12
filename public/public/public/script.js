const chat = document.getElementById("chat");

const input = document.getElementById("message");

const historyBox =
  document.getElementById("history");

const sendButton =
  document.getElementById("send");


let messages = [];


/* ENTER PARA ENVIAR */

input.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* ENVIAR MENSAJE */

function sendMessage() {

  const text =
    input.value.trim();

  if (!text) {
    return;
  }


  addMessage(
    text,
    "user"
  );


  addHistory(text);


  input.value = "";


  const answer =
    getDemoAnswer(text);


  setTimeout(
    function () {

      addMessage(
        answer,
        "ai"
      );

    },
    600
  );

}


/* AGREGAR MENSAJE */

function addMessage(
  text,
  type
) {

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

}


/* HISTORIAL */

function addHistory(text) {

  const item =
    document.createElement("div");


  item.className =
    "history-item";


  item.textContent =
    text;


  historyBox.prepend(item);

}


/* BOTONES DE SUGERENCIAS */

function suggest(text) {

  input.value = text;

  input.focus();

}


/* NUEVO CHAT */

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
        Pregunta, aprende, crea y descubre con ToolBox AI.
      </p>

    </div>

  `;

  input.focus();

}


/* BORRAR CHAT */

function clearChat() {

  newChat();

}


/* MODO OSCURO */

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

}


/* MENÚ CELULAR */

function toggleSidebar() {

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

}


/* INFORMACIÓN */

function showAbout() {

  alert(
    "ToolBox AI\n\n" +
    "Asistente inteligente.\n" +
    "Versión 1.0"
  );

}


/* RESPUESTAS DE PRUEBA */

function getDemoAnswer(text) {

  const lower =
    text.toLowerCase();


  if (
    lower.includes("hola") ||
    lower.includes("buenas")
  ) {

    return (
      "¡Hola! 👋 Soy ToolBox AI. " +
      "¿En qué puedo ayudarte?"
    );

  }


  if (
    lower.includes("isaac newton") ||
    lower.includes("newton")
  ) {

    return (
      "Isaac Newton fue un físico, matemático " +
      "y astrónomo inglés. Nació en 1643 y murió " +
      "en 1727. Es conocido por sus trabajos sobre " +
      "las leyes del movimiento y la gravitación " +
      "universal. También realizó importantes " +
      "contribuciones al desarrollo del cálculo."
    );

  }


  if (
    lower.includes("dinero") ||
    lower.includes("ganar")
  ) {

    return (
      "💰 Algunas formas de ganar dinero por " +
      "internet son crear páginas web, ofrecer " +
      "servicios digitales, crear contenido o " +
      "vender productos digitales."
    );

  }


  if (
    lower.includes("web") ||
    lower.includes("página")
  ) {

    return (
      "💻 Podemos crear una página web usando " +
      "HTML, CSS y JavaScript. Después podemos " +
      "añadir un servidor y conectar una IA real."
    );

  }


  if (
    lower.includes("tarea") ||
    lower.includes("estudiar")
  ) {

    return (
      "📚 Claro. Puedo ayudarte a entender " +
      "un tema, hacer un resumen, preparar " +
      "preguntas o practicar para un examen."
    );

  }


  return (
    "Soy ToolBox AI y actualmente estoy en " +
    "modo de demostración. Esta respuesta " +
    "es generada por JavaScript. " +
    "El siguiente paso será conectar una " +
    "IA real mediante una API."
  );

}
