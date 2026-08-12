const chat = document.getElementById("chat");
const input = document.getElementById("message");
const historyBox = document.getElementById("history");
const sendButton = document.getElementById("send");

let messages = [];

let userId =
    localStorage.getItem("morvix-user-id");

if (!userId) {

    userId =
        crypto.randomUUID();

    localStorage.setItem(
        "morvix-user-id",
        userId
    );
}


/*
====================================================
                    INPUT
====================================================
*/

input.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


input.addEventListener(
    "input",
    () => {

        input.style.height = "auto";

        input.style.height =
            Math.min(
                input.scrollHeight,
                150
            ) + "px";
    }
);


/*
====================================================
                    CHAT
====================================================
*/

async function sendMessage() {

    const text =
        input.value.trim();

    if (
        !text ||
        sendButton.disabled
    ) {
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

    addHistory(text);

    input.value = "";

    input.style.height = "auto";

    const thinking =
        addThinking();

    sendButton.disabled = true;

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-morvix-user":
                            userId
                    },

                    body: JSON.stringify({
                        messages
                    })
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

        await typeMessage(
            data.answer
        );

        messages.push({
            role: "assistant",
            content: data.answer
        });

    } catch (error) {

        thinking.remove();

        addMessage(
            "❌ " +
            error.message,
            "ai"
        );

        console.error(error);

    }

    sendButton.disabled = false;

    input.focus();
}


/*
====================================================
              ANIMACIÓN DE ESCRITURA
====================================================
*/

async function typeMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message ai";

    const icon =
        document.createElement("div");

    icon.className =
        "message-icon ai-icon";

    icon.textContent =
        "✦";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    message.appendChild(icon);
    message.appendChild(content);

    chat.appendChild(message);

    let current = "";

    const words =
        text.split(" ");

    for (
        let i = 0;
        i < words.length;
        i++
    ) {

        current +=
            (i ? " " : "") +
            words[i];

        content.innerHTML =
            renderMarkdown(
                current
            );

        chat.scrollTop =
            chat.scrollHeight;

        await sleep(10);
    }

    addActions(
        message,
        text
    );

    return message;
}


/*
====================================================
                    MENSAJES
====================================================
*/

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

    if (type === "ai") {

        content.innerHTML =
            renderMarkdown(text);

    } else {

        content.textContent =
            text;
    }

    message.appendChild(icon);

    message.appendChild(content);

    chat.appendChild(message);

    if (type === "ai") {
        addActions(
            message,
            text
        );
    }

    chat.scrollTop =
        chat.scrollHeight;

    return message;
}


/*
====================================================
                  PENSANDO
====================================================
*/

function addThinking() {

    const message =
        document.createElement("div");

    message.className =
        "message ai";

    message.innerHTML = `
        <div class="message-icon ai-icon">
            ✦
        </div>

        <div class="message-content">
            MORVIX está pensando
            <span class="dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        </div>
    `;

    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;

    return message;
}


/*
====================================================
                  MARKDOWN
====================================================
*/

function renderMarkdown(text) {

    let html =
        escapeHtml(text);

    html =
        html.replace(
            /```([\s\S]*?)```/g,
            (match, code) => {

                const safe =
                    code.trim();

                return `
                    <div class="code-wrapper">

                        <div class="code-header">

                            <span>
                                Código
                            </span>

                            <button
                                onclick="copyText(this)"
                                data-copy="${encodeURIComponent(safe)}"
                            >
                                📋 Copiar
                            </button>

                        </div>

                        <pre><code>${safe}</code></pre>

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
            /^- (.*)$/gm,
            "<li>$1</li>"
        );

    html =
        html.replace(
            /(<li>.*<\/li>)/gs,
            "<ul>$1</ul>"
        );

    html =
        html.replace(
            /\n/g,
            "<br>"
        );

    return html;
}


/*
====================================================
                ACCIONES RESPUESTA
====================================================
*/

function addActions(
    message,
    text
) {

    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";

    actions.innerHTML = `

        <button>
            📋 Copiar
        </button>

        <button>
            🔄 Regenerar
        </button>

        <button>
            🔊 Escuchar
        </button>

    `;

    actions.children[0]
        .onclick =
        () => copyTextValue(text);

    actions.children[1]
        .onclick =
        () => regenerate(text);

    actions.children[2]
        .onclick =
        () => speak(text);

    message
        .querySelector(
            ".message-content"
        )
        .appendChild(actions);
}


/*
====================================================
                    COPIAR
====================================================
*/

async function copyTextValue(text) {

    try {

        await navigator.clipboard
            .writeText(text);

        alert(
            "Respuesta copiada."
        );

    } catch {

        alert(
            "No se pudo copiar."
        );
    }
}


async function copyText(button) {

    const text =
        decodeURIComponent(
            button.dataset.copy
        );

    try {

        await navigator.clipboard
            .writeText(text);

        button.textContent =
            "✓ Copiado";

        setTimeout(
            () => {
                button.textContent =
                    "📋 Copiar";
            },
            1500
        );

    } catch {}
}


/*
====================================================
                  REGENERAR
====================================================
*/

async function regenerate() {

    if (
        messages.length === 0
    ) {
        return;
    }

    const last =
        messages
            .filter(
                m =>
                    m.role === "user"
            )
            .pop();

    if (!last) {
        return;
    }

    messages =
        messages.slice(
            0,
            messages.length - 1
        );

    input.value =
        last.content;

    await sendMessage();
}


/*
====================================================
                    VOZ
====================================================
*/

function startVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Tu navegador no admite reconocimiento de voz."
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang =
        "es-PE";

    recognition.start();

    recognition.onresult =
        event => {

            input.value =
                event.results[0][0]
                    .transcript;

            input.focus();
        };
}


function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.lang =
        "es-PE";

    speechSynthesis.speak(
        utterance
    );
}


/*
====================================================
                    ARCHIVOS
====================================================
*/

function openFile() {

    document
        .getElementById("fileInput")
        .click();
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

        let message =
            `He recibido el archivo **${file.name}**.`;

        if (data.text) {

            message +=
                `\n\nContenido:\n\n${data.text.slice(0, 12000)}`;
        }

        input.value =
            `Analiza el archivo ${file.name} y ayúdame con él.`;

        addMessage(
            message,
            "ai"
        );

    } catch (error) {

        addMessage(
            "❌ " + error.message,
            "ai"
        );
    }
}


function openImage() {

    document
        .getElementById("imageInput")
        .click();
}


function uploadImage(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    input.value =
        `Analiza esta imagen: ${file.name}`;

    input.focus();

    alert(
        "La imagen está seleccionada. Podemos conectar el análisis multimodal en el siguiente paso del backend."
    );
}


/*
====================================================
              GENERAR IMAGEN
====================================================
*/

async function generateImage() {

    const prompt =
        window.prompt(
            "¿Qué imagen quieres crear?"
        );

    if (!prompt) {
        return;
    }

    addMessage(
        "🎨 Crear imagen: " +
        prompt,
        "user"
    );

    try {

        const response =
            await fetch(
                "/api/generate-image",
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

        if (!response.ok) {
            throw new Error(
                data.error
            );
        }

        if (data.url) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                data.url;

            image.style.maxWidth =
                "100%";

            image.style.borderRadius =
                "15px";

            chat.appendChild(
                image
            );

        }

    } catch (error) {

        addMessage(
            "🎨 " +
            error.message,
            "ai"
        );
    }
}


/*
====================================================
                BÚSQUEDA WEB
====================================================
*/

function webSearch() {

    const query =
        input.value.trim();

    if (!query) {

        alert(
            "Escribe primero lo que quieres buscar."
        );

        return;
    }

    window.open(
        "https://www.google.com/search?q=" +
        encodeURIComponent(query),
        "_blank"
    );
}


/*
====================================================
                    HISTORIAL
====================================================
*/

function addHistory(text) {

    const item =
        document.createElement("div");

    item.className =
        "history-item";

    item.textContent =
        text;

    item.title =
        text;

    historyBox.prepend(
        item
    );

    saveHistory();
}


function saveHistory() {

    localStorage.setItem(
        "morvix-history",
        historyBox.innerHTML
    );
}


function loadHistory() {

    const saved =
        localStorage.getItem(
            "morvix-history"
        );

    if (saved) {

        historyBox.innerHTML =
            saved;
    }
}


/*
====================================================
                  NUEVO CHAT
====================================================
*/

function newChat() {

    messages = [];

    chat.innerHTML = `
        <div class="welcome">

            <div class="hero-logo">
                ✦
            </div>

            <div class="badge">
                ✨ MORVIX AI
            </div>

            <h1>
                ¿Qué quieres crear hoy?
            </h1>

            <p>
                Pregunta, aprende, programa,
                crea imágenes y descubre nuevas ideas.
            </p>

        </div>
    `;

    input.value = "";

    input.focus();
}


function clearChat() {

    newChat();
}


function removeWelcome() {

    const welcome =
        chat.querySelector(
            ".welcome"
        );

    if (welcome) {
        welcome.remove();
    }
}


/*
====================================================
                  HERRAMIENTAS
====================================================
*/

function toggleTools() {

    document
        .getElementById("tool-menu")
        .classList.toggle("open");
}


/*
====================================================
                    TEMA
====================================================
*/

function toggleTheme() {

    document.body
        .classList.toggle(
            "dark"
        );

    localStorage.setItem(
        "morvix-dark",
        document.body.classList.contains(
            "dark"
        )
    );
}


function loadTheme() {

    if (
        localStorage.getItem(
            "morvix-dark"
        ) === "true"
    ) {

        document.body
            .classList.add(
                "dark"
            );
    }
}


/*
====================================================
                  SIDEBAR
====================================================
*/

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle(
            "open"
        );
}


/*
====================================================
                  ESTADÍSTICAS
====================================================
*/

async function showStats() {

    const modal =
        document.getElementById(
            "statsModal"
        );

    modal.classList.remove(
        "hidden"
    );

    try {

        const response =
            await fetch(
                "/api/stats"
            );

        const data =
            await response.json();

        document.getElementById(
            "statUsers"
        ).textContent =
            data.users;

        document.getElementById(
            "statRequests"
        ).textContent =
            data.requests;

        document.getElementById(
            "statImages"
        ).textContent =
            data.images;

        document.getElementById(
            "statFiles"
        ).textContent =
            data.files;

    } catch {

        alert(
            "No se pudieron cargar las estadísticas."
        );
    }
}


function closeStats() {

    document
        .getElementById(
            "statsModal"
        )
        .classList.add(
            "hidden"
        );
}


/*
====================================================
                    INFO
====================================================
*/

function showAbout() {

    alert(
        "MORVIX AI 3.0\n\n" +
        "Asistente inteligente creado para ayudarte a estudiar, programar, crear y descubrir."
    );
}


/*
====================================================
                    SUGERENCIAS
====================================================
*/

function suggest(text) {

    input.value =
        text;

    input.focus();

}


/*
====================================================
                    UTILS
====================================================
*/

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


function escapeHtml(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


loadTheme();

loadHistory();
