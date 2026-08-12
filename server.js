const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendButton = document.getElementById("send");
const historyBox = document.getElementById("history");

let messages = [];

let stats = {
  messages: 0,
  images: 0,
  files: 0
};

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded", () => {

  setupInput();
  loadTheme();
  loadHistory();
  updateStats();

});

/* =========================
   INPUT
========================= */

function setupInput() {

  input.addEventListener("keydown", event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  });

  input.addEventListener("input", () => {

    input.style.height = "auto";

    input.style.height =
      Math.min(input.scrollHeight, 180) + "px";

  });

}

/* =========================
   CHAT
========================= */

async function sendMessage() {

  const text =
    input.value.trim();

  if (!text || sendButton.disabled) {
    return;
  }

  removeWelcome();

  addMessage(
    text,
    "user"
  );

  messages.push({
    role: "user",
    content: text
  });

  saveHistory(text);

  input.value = "";

  input.style.height = "auto";

  sendButton.disabled = true;

  const thinking =
    createThinking();

  try {

    const response =
      await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          messages
        })

      });

    const data =
      await response.json();

    thinking.remove();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Error del servidor"
      );
    }

    const messageElement =
      addMessage(
        "",
        "ai"
      );

    await typeMarkdown(
      messageElement.querySelector(".message-text"),
      data.answer
    );

    addCopyButton(
      messageElement,
      data.answer
    );

    messages.push({
      role: "assistant",
      content: data.answer
    });

    stats.messages++;

    updateStats();

  } catch (error) {

    thinking.remove();

    addMessage(
      "❌ " + error.message,
      "ai"
    );

    console.error(error);

  }

  sendButton.disabled = false;

  input.focus();

}

/* =========================
   MENSAJES
========================= */

function addMessage(text, type) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message ${type}`;

  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    type === "user"
      ? "M"
      : "✦";

  const body =
    document.createElement("div");

  body.className =
    "message-body";

  const messageText =
    document.createElement("div");

  messageText.className =
    "message-text";

  if (text) {
    messageText.innerHTML =
      markdownToHTML(text);
  }

  body.appendChild(messageText);

  wrapper.appendChild(avatar);

  wrapper.appendChild(body);

  chat.appendChild(wrapper);

  scrollChat();

  return wrapper;

}

/* =========================
   MARKDOWN
========================= */

function markdownToHTML(text) {

  let html =
    escapeHTML(text);

  html =
    html.replace(
      /```([\s\S]*?)```/g,
      (_, code) => {

        return `
          <div class="code-block">
            <button
              class="copy-code"
              onclick="copyText(this.dataset.code)"
              data-code="${encodeURIComponent(code.trim())}">
              Copiar
            </button>
            <pre><code>${code.trim()}</code></pre>
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
      /^\- (.*)$/gm,
      "<li>$1</li>"
    );

  html =
    html.replace(
      /\n/g,
      "<br>"
    );

  html =
    html.replace(
      /(<li>.*?<\/li>)/g,
      "<ul>$1</ul>"
    );

  return html;

}

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* =========================
   ESCRITURA ANIMADA
========================= */

async function typeMarkdown(element, text) {

  element.innerHTML = "";

  let current = "";

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    current += text[i];

    element.innerHTML =
      markdownToHTML(current);

    scrollChat();

    await sleep(
      text[i] === " "
        ? 8
        : 12
    );

  }

}

/* =========================
   PENSANDO
========================= */

function createThinking() {

  const element =
    addMessage(
      "",
      "ai"
    );

  const text =
    element.querySelector(
      ".message-text"
    );

  text.innerHTML = `
    <div class="thinking">
      <span></span>
      <span></span>
      <span></span>
      <b>MORVIX está pensando...</b>
    </div>
  `;

  return element;

}

/* =========================
   COPIAR
========================= */

function addCopyButton(
  messageElement,
  text
) {

  const button =
    document.createElement("button");

  button.className =
    "copy-answer";

  button.textContent =
    "📋 Copiar";

  button.onclick = () =>
    copyText(text);

  messageElement
    .querySelector(".message-body")
    .appendChild(button);

}

async function copyText(text) {

  try {

    const decoded =
      decodeURIComponent(text);

    await navigator.clipboard.writeText(
      decoded
    );

  } catch {

    await navigator.clipboard.writeText(
      text
    );

  }

}

/* =========================
   IMÁGENES
========================= */

async function generateImage() {

  const prompt =
    window.prompt(
      "🎨 ¿Qué imagen quieres crear?"
    );

  if (!prompt) {
    return;
  }

  removeWelcome();

  const loading =
    createThinking();

  try {

    const response =
      await fetch(
        "/api/image",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            prompt
          })
        }
      );

    const data =
      await response.json();

    loading.remove();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "No se pudo generar la imagen."
      );

    }

    const wrapper =
      addMessage(
        "",
        "ai"
      );

    const body =
      wrapper.querySelector(
        ".message-text"
      );

    body.innerHTML = `
      <p>🎨 Imagen generada:</p>

      <img
        src="${data.image}"
        class="generated-image"
        alt="Imagen generada por MORVIX AI"
      >

      <br>

      <button
        class="download-image"
        onclick="downloadImage('${data.image}')">
        ⬇️ Guardar imagen
      </button>
    `;

    stats.images++;

    updateStats();

  } catch (error) {

    loading.remove();

    addMessage(
      "❌ " + error.message,
      "ai"
    );

  }

}

function downloadImage(src) {

  const link =
    document.createElement("a");

  link.href = src;

  link.download =
    "morvix-imagen.png";

  link.click();

}

/* =========================
   ARCHIVOS
========================= */

function openFilePicker() {

  let picker =
    document.getElementById(
      "filePicker"
    );

  if (!picker) {

    picker =
      document.createElement("input");

    picker.type = "file";

    picker.id =
      "filePicker";

    picker.accept =
      ".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg";

    picker.style.display =
      "none";

    document.body.appendChild(
      picker
    );

    picker.addEventListener(
      "change",
      uploadFile
    );

  }

  picker.click();

}

async function uploadFile(event) {

  const file =
    event.target.files[0];

  if (!file) {
    return;
  }

  const form =
    new FormData();

  form.append(
    "file",
    file
  );

  addMessage(
    `📎 Archivo seleccionado: ${file.name}`,
    "user"
  );

  try {

    const response =
      await fetch(
        "/api/upload",
        {
          method: "POST",
          body: form
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error
      );
    }

    addMessage(
      "✅ " + data.message,
      "ai"
    );

    stats.files++;

    updateStats();

  } catch (error) {

    addMessage(
      "❌ " + error.message,
      "ai"
    );

  }

  event.target.value = "";

}

/* =========================
   IMAGEN SUBIDA
========================= */

function uploadImage() {

  const picker =
    document.createElement(
      "input"
    );

  picker.type =
    "file";

  picker.accept =
    "image/*";

  picker.onchange =
    () => {

      const file =
        picker.files[0];

      if (!file) {
        return;
      }

      addMessage(
        `🖼️ Imagen seleccionada: ${file.name}`,
        "user"
      );

      addMessage(
        "🖼️ Imagen recibida. El análisis visual puede conectarse a Gemini cuando quieras.",
        "ai"
      );

    };

  picker.click();

}

/* =========================
   BÚSQUEDA
========================= */

async function webSearch() {

  const query =
    window.prompt(
      "🌐 ¿Qué quieres buscar?"
    );

  if (!query) {
    return;
  }

  addMessage(
    "🌐 Buscando: " + query,
    "user"
  );

  try {

    const response =
      await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

    const data =
      await response.json();

    addMessage(
      data.message,
      "ai"
    );

  } catch {

    addMessage(
      "❌ No se pudo realizar la búsqueda.",
      "ai"
    );

  }

}

/* =========================
   MENÚ +
========================= */

function toggleTools() {

  const menu =
    document.getElementById(
      "toolsMenu"
    );

  if (!menu) {
    return;
  }

  menu.classList.toggle(
    "show"
  );

}

/* =========================
   HISTORIAL
========================= */

function saveHistory(text) {

  let history =
    JSON.parse(
      localStorage.getItem(
        "morvix-history"
      ) || "[]"
    );

  history.unshift(text);

  history =
    history.slice(0, 30);

  localStorage.setItem(
    "morvix-history",
    JSON.stringify(history)
  );

  loadHistory();

}

function loadHistory() {

  if (!historyBox) {
    return;
  }

  historyBox.innerHTML = "";

  const history =
    JSON.parse(
      localStorage.getItem(
        "morvix-history"
      ) || "[]"
    );

  history.forEach(text => {

    const item =
      document.createElement(
        "button"
      );

    item.className =
      "history-item";

    item.textContent =
      text;

    item.onclick = () => {

      input.value =
        text;

      input.focus();

    };

    historyBox.appendChild(
      item
    );

  });

}

/* =========================
   NUEVO CHAT
========================= */

function newChat() {

  messages = [];

  chat.innerHTML = `
    <div class="welcome" id="welcome">
      <div class="big-logo">✦</div>

      <h1>
        ¿Qué quieres hacer hoy?
      </h1>

      <p>
        Pregunta, crea, aprende y descubre
        con MORVIX AI.
      </p>

      <div class="welcome-grid">

        <button onclick="suggest('Explícame un tema de estudio')">
          🧠 Aprender
        </button>

        <button onclick="generateImage()">
          🎨 Crear imagen
        </button>

        <button onclick="suggest('Ayúdame a programar una página web')">
          💻 Programar
        </button>

        <button onclick="suggest('Dame ideas creativas')">
          ✨ Ideas
        </button>

      </div>
    </div>
  `;

  input.focus();

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
   LIMPIAR
========================= */

function clearChat() {

  messages = [];

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
    "morvix-theme",
    document.body.classList.contains(
      "dark"
    )
      ? "dark"
      : "light"
  );

}

function loadTheme() {

  if (
    localStorage.getItem(
      "morvix-theme"
    ) === "dark"
  ) {

    document.body.classList.add(
      "dark"
    );

  }

}

/* =========================
   SIDEBAR
========================= */

function toggleSidebar() {

  document
    .querySelector(
      ".sidebar"
    )
    ?.classList.toggle(
      "open"
    );

}

/* =========================
   PERFIL
========================= */

function showAbout() {

  alert(
    "✦ MORVIX AI\n\n" +
    "Asistente de inteligencia artificial.\n\n" +
    "Plan: Gratuito"
  );

}

/* =========================
   ESTADÍSTICAS
========================= */

async function updateStats() {

  try {

    const response =
      await fetch(
        "/api/stats"
      );

    const data =
      await response.json();

    const visitors =
      document.getElementById(
        "statVisitors"
      );

    const messagesElement =
      document.getElementById(
        "statMessages"
      );

    const images =
      document.getElementById(
        "statImages"
      );

    if (visitors) {
      visitors.textContent =
        data.visitors;
    }

    if (messagesElement) {
      messagesElement.textContent =
        data.messages;
    }

    if (images) {
      images.textContent =
        data.images;
    }

  } catch {}

}

/* =========================
   UTILIDADES
========================= */

function removeWelcome() {

  document
    .getElementById(
      "welcome"
    )
    ?.remove();

}

function scrollChat() {

  chat.scrollTop =
    chat.scrollHeight;

}

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

}
