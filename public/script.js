const chat =
  document.getElementById("chat");

const input =
  document.getElementById("message");

const historyBox =
  document.getElementById("history");

const sendButton =
  document.getElementById("send");

const stopButton =
  document.getElementById("stop");

const micButton =
  document.getElementById("micButton");

const fileInput =
  document.getElementById("fileInput");

const filePreview =
  document.getElementById("file-preview");

const codeButton =
  document.getElementById("codeButton");


let messages = [];

let selectedFile = null;

let currentController = null;

let codeMode = false;

let recognition = null;

let currentChatId =
  Date.now().toString();


/* =========================
   INICIO
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSavedChat();

    loadHistory();

    setupVoice();

  }
);


/* =========================
   ENTER
========================= */

input.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* =========================
   ENVIAR
========================= */

async function sendMessage() {

  const text =
    input.value.trim();


  if (
    (!text && !selectedFile) ||
    sendButton.disabled
  ) {

    return;

  }


  let finalText =
    text || "Analiza este archivo.";


  if (codeMode) {

    finalText =
      `MODO PROGRAMACIÓN ACTIVADO.

${finalText}

Responde como un experto programador.`;

  }


  addMessage(
    finalText,
    "user"
  );


  messages.push({

    role: "user",

    content: finalText

  });


  input.value = "";

  input.style.height = "auto";


  const fileToSend =
    selectedFile;


  removeSelectedFile();


  const thinking =
    addMessage(
      "MORVIX AI está pensando...",
      "ai"
    );


  sendButton.disabled = true;

  stopButton.classList.remove(
    "hidden"
  );


  currentController =
    new AbortController();


  try {

    const formData =
      new FormData();


    formData.append(
      "messages",
      JSON.stringify(messages)
    );


    if (fileToSend) {

      formData.append(
        "file",
        fileToSend
      );

    }


    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          body: formData,

          signal:
            currentController.signal
        }
      );


    const data =
      await response.json();


    thinking.remove();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Error del servidor"
      );

    }


    addMessage(
      data.answer,
      "ai"
    );


    messages.push({

      role: "assistant",

      content:
        data.answer

    });


    saveCurrentChat();


  } catch (error) {

    thinking.remove();


    if (
      error.name ===
      "AbortError"
    ) {

      addMessage(
        "⏹️ Respuesta detenida.",
        "ai"
      );

    } else {

      addMessage(

        "❌ MORVIX AI no pudo conectarse con la IA.\n\n" +
        error.message,

        "ai"

      );

      console.error(
        "Error:",
        error
      );

    }

  }


  sendButton.disabled =
    false;

  stopButton.classList.add(
    "hidden"
  );

  currentController =
    null;

  input.focus();

}


/* =========================
   DETENER
========================= */

function stopGeneration() {

  if (
    currentController
  ) {

    currentController.abort();

  }

}


/* =========================
   MENSAJES
========================= */

function addMessage(
  text,
  type
) {

  const message =
    document.createElement(
      "div"
    );


  message.className =
    "message " + type;


  const icon =
    document.createElement(
      "div"
    );


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
    document.createElement(
      "div"
    );


  content.className =
    "message-content";


  if (
    type === "ai"
  ) {

    content.innerHTML =
      renderMarkdown(text);

  } else {

    content.textContent =
      text;

  }


  message.appendChild(
    icon
  );


  message.appendChild(
    content
  );


  if (
    type === "ai" &&
    text !==
      "MORVIX AI está pensando..."
  ) {

    const actions =
      document.createElement(
        "div"
      );


    actions.className =
      "message-actions";


    const copy =
      document.createElement(
        "button"
      );


    copy.textContent =
      "📋 Copiar";


    copy.onclick =
      () => {

        navigator.clipboard.writeText(
          text
        );

        copy.textContent =
          "✅ Copiado";

        setTimeout(
          () => {
            copy.textContent =
              "📋 Copiar";
          },
          1500
        );

      };


    const speak =
      document.createElement(
        "button"
      );


    speak.textContent =
      "🔊 Escuchar";


    speak.onclick =
      () => speakText(text);


    actions.appendChild(
      copy
    );


    actions.appendChild(
      speak
    );


    content.appendChild(
      actions
    );

  }


  chat.appendChild(
    message
  );


  chat.scrollTop =
    chat.scrollHeight;


  return message;

}


/* =========================
   MARKDOWN
========================= */

function escapeHTML(text) {

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function renderMarkdown(text) {

  let html =
    escapeHTML(text);


  const codeBlocks = [];


  html =
    html.replace(
      /```(\w+)?\n?([\s\S]*?)```/g,
      function(_, language, code) {

        const id =
          "code-" +
          Math.random()
            .toString(36)
            .substring(2);


        codeBlocks.push({
          id,
          code
        });


        return `
          <div class="code-wrapper">
            <div class="code-header">
              <span>${language || "código"}</span>
              <button
                class="copy-code"
                onclick="copyCode('${id}')"
              >
                📋 Copiar
              </button>
            </div>

            <pre id="${id}">${code}</pre>
          </div>
        `;

      }
    );


  html =
    html.replace(
      /^### (.*)$/gm,
      "<h3>$1</h3>"
    );


  html =
    html.replace(
      /^## (.*)$/gm,
      "<h2>$1</h2>"
    );


  html =
    html.replace(
      /^# (.*)$/gm,
      "<h1>$1</h1>"
    );


  html =
    html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  html =
    html.replace(
      /\*(.*?)\*/g,
      "<em>$1</em>"
    );


  html =
    html.replace(
      /`([^`\n]+)`/g,
      '<span class="inline-code">$1</span>'
    );


  html =
    html.replace(
      /^\- (.*)$/gm,
      "<li>$1</li>"
    );


  html =
    html.replace(
      /(<li>.*<\/li>)/gs,
      "<ul>$1</ul>"
    );


  html =
    html.replace(
      /\n\n/g,
      "<br><br>"
    );


  html =
    html.replace(
      /\n/g,
      "<br>"
    );


  return html;

}


function copyCode(id) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  navigator.clipboard.writeText(
    element.innerText
  );

}


/* =========================
   SUGERENCIAS
========================= */

function suggest(text) {

  input.value =
    text;

  input.focus();

}


/* =========================
   NUEVO CHAT
========================= */

function newChat() {

  saveCurrentChat();


  messages = [];

  currentChatId =
    Date.now().toString();


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

        <button onclick="suggest('Dame ideas creativas para un proyecto')">
          💡 Dame ideas
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


/* =========================
   HISTORIAL
========================= */

function saveCurrentChat() {

  if (
    messages.length === 0
  ) {

    return;

  }


  const chats =
    JSON.parse(
      localStorage.getItem(
        "morvix_chats"
      ) || "{}"
    );


  chats[currentChatId] = {

    id: currentChatId,

    title:
      messages[0]
        ?.content
        ?.substring(0, 50) ||
      "Nueva conversación",

    messages: messages,

    date:
      new Date().toLocaleString()

  };


  localStorage.setItem(
    "morvix_chats",
    JSON.stringify(chats)
  );


  loadHistory();

}


function loadHistory() {

  historyBox.innerHTML =
    "";


  const chats =
    JSON.parse(
      localStorage.getItem(
        "morvix_chats"
      ) || "{}"
    );


  const list =
    Object.values(chats)
      .reverse();


  list.forEach(
    chatData => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "history-item";


      item.textContent =
        chatData.title;


      item.onclick =
        () => loadChat(
          chatData.id
        );


      historyBox.appendChild(
        item
      );

    }
  );

}


function loadChat(id) {

  const chats =
    JSON.parse(
      localStorage.getItem(
        "morvix_chats"
      ) || "{}"
    );


  const selected =
    chats[id];


  if (!selected) {
    return;
  }


  currentChatId =
    selected.id;


  messages =
    selected.messages || [];


  chat.innerHTML =
    "";


  messages.forEach(
    message => {

      addMessage(
        message.content,
        message.role === "user"
          ? "user"
          : "ai"
      );

    }
  );

}


/* =========================
   GUARDAR
========================= */

function loadSavedChat() {

  const saved =
    localStorage.getItem(
      "morvix_current"
    );


  if (!saved) {
    return;
  }


  try {

    messages =
      JSON.parse(saved);


    messages.forEach(
      message => {

        addMessage(
          message.content,
          message.role === "user"
            ? "user"
            : "ai"
        );

      }
    );

  } catch {

    messages = [];

  }

}


function saveCurrentState() {

  localStorage.setItem(
    "morvix_current",
    JSON.stringify(messages)
  );

}


window.addEventListener(
  "beforeunload",
  saveCurrentState
);


/* =========================
   BORRAR
========================= */

function clearChat() {

  if (
    !confirm(
      "¿Quieres borrar esta conversación?"
    )
  ) {

    return;

  }


  messages = [];


  localStorage.removeItem(
    "morvix_current"
  );


  delete localStorage[
    "morvix_chats"
  ];


  currentChatId =
    Date.now().toString();


  newChat();

}


/* =========================
   TEMA
========================= */

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );


  localStorage.setItem(
    "morvix_theme",
    document.body.classList.contains(
      "dark"
    )
      ? "dark"
      : "light"
  );

}


if (
  localStorage.getItem(
    "morvix_theme"
  ) === "dark"
) {

  document.body.classList.add(
    "dark"
  );

}


/* =========================
   SIDEBAR
========================= */

function toggleSidebar() {

  document
    .querySelector(".sidebar")
    .classList.toggle(
      "open"
    );

}


/* =========================
   ARCHIVOS
========================= */

function handleFile(
  inputElement
) {

  const file =
    inputElement.files[0];


  if (!file) {
    return;
  }


  if (
    file.size >
    20 * 1024 * 1024
  ) {

    alert(
      "El archivo supera los 20 MB."
    );

    inputElement.value =
      "";

    return;

  }


  selectedFile =
    file;


  filePreview.classList.remove(
    "hidden"
  );


  filePreview.innerHTML = `

    <span class="file-name">
      📎 ${escapeHTML(file.name)}
    </span>

    <button
      class="remove-file"
      onclick="removeSelectedFile()"
    >
      ✕
    </button>

  `;


  input.focus();

}


function removeSelectedFile() {

  selectedFile =
    null;


  fileInput.value =
    "";


  filePreview.classList.add(
    "hidden"
  );


  filePreview.innerHTML =
    "";

}


/* =========================
   MODO PROGRAMACIÓN
========================= */

function toggleCodeMode() {

  codeMode =
    !codeMode;


  codeButton.classList.toggle(
    "active",
    codeMode
  );


  input.placeholder =
    codeMode
      ? "Describe lo que quieres programar..."
      : "Escribe un mensaje...";

}


/* =========================
   VOZ - MICRÓFONO
========================= */

function setupVoice() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    micButton.title =
      "Tu navegador no soporta reconocimiento de voz";

    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.lang =
    "es-ES";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.onstart =
    () => {

      micButton.classList.add(
        "active"
      );

    };


  recognition.onend =
    () => {

      micButton.classList.remove(
        "active"
      );

    };


  recognition.onresult =
    (event) => {

      const transcript =
        event.results[0][0].transcript;


      input.value +=
        (
          input.value
            ? " "
            : ""
        ) +
        transcript;

    };

}


function toggleMic() {

  if (!recognition) {

    alert(
      "Tu navegador no soporta reconocimiento de voz."
    );

    return;

  }


  if (
    micButton.classList.contains(
      "active"
    )
  ) {

    recognition.stop();

  } else {

    recognition.start();

  }

}


/* =========================
   TEXTO A VOZ
========================= */

function speakText(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    alert(
      "Tu navegador no soporta lectura por voz."
    );

    return;

  }


  speechSynthesis.cancel();


  const clean =
    text
      .replace(
        /```[\s\S]*?```/g,
        " bloque de código "
      )
      .replace(
        /[#*_`]/g,
        ""
      );


  const utterance =
    new SpeechSynthesisUtterance(
      clean
    );


  utterance.lang =
    "es-ES";


  utterance.rate =
    1;


  utterance.pitch =
    1;


  speechSynthesis.speak(
    utterance
  );

}


/* =========================
   CONFIGURACIÓN
========================= */

function showAbout() {

  alert(
    "MORVIX AI 2.0\n\n" +
    "🤖 Inteligencia artificial\n" +
    "🎙️ Voz\n" +
    "🔊 Lectura de respuestas\n" +
    "📎 Archivos\n" +
    "💻 Modo programación\n" +
    "💾 Historial local\n\n" +
    "Desarrollado con Gemini + Render."
  );

}
