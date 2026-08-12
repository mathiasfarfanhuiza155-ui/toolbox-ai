const chat = document.getElementById("chat");

const input =
    document.getElementById("message");

const historyBox =
    document.getElementById("history");

const sendButton =
    document.getElementById("send");

const imageCreator =
    document.getElementById("imageCreator");

const statsPanel =
    document.getElementById("statsPanel");

const imagePrompt =
    document.getElementById("imagePrompt");

const imageResult =
    document.getElementById("imageResult");

let messages = [];


// ========================================
// INICIO
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    registerVisit();

    input.focus();

});


// ========================================
// ENTER
// ========================================

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


// ========================================
// ENVIAR MENSAJE
// ========================================

async function sendMessage() {

    const text =
        input.value.trim();

    if (
        !text ||
        sendButton.disabled
    ) {

        return;

    }

    hidePanels();

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

    autoResize();

    const thinking =
        addMessage(
            "MORVIX está pensando...",
            "ai"
        );

    sendButton.disabled = true;

    try {

        const response =
            await fetch(
                "/api/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            messages:
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
                "Error del servidor."
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


    } catch(error) {

        thinking.remove();

        addMessage(

            "❌ MORVIX no pudo conectarse con la IA.\n\n" +
            error.message,

            "ai"

        );

        console.error(error);

    }


    sendButton.disabled = false;

    input.focus();

}


// ========================================
// AGREGAR MENSAJE
// ========================================

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


    content.innerHTML =
        formatText(text);


    message.appendChild(icon);

    message.appendChild(content);

    chat.appendChild(message);


    chat.scrollTop =
        chat.scrollHeight;


    return message;

}


// ========================================
// FORMATO DE RESPUESTAS
// ========================================

function formatText(text) {

    let safe =
        escapeHTML(text);


    safe =
        safe.replace(
            /```([\s\S]*?)```/g,
            '<pre><code>$1</code></pre>'
        );


    safe =
        safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    safe =
        safe.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


    safe =
        safe.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    safe =
        safe.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    safe =
        safe.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    safe =
        safe.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );


    return safe;

}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ========================================
// HISTORIAL
// ========================================

function addHistory(text) {

    const item =
        document.createElement("div");

    item.className =
        "history-item";

    item.textContent =
        text;

    item.onclick =
        () => {

            input.value =
                text;

            input.focus();

        };


    historyBox.prepend(item);

}


// ========================================
// SUGERENCIAS
// ========================================

function suggest(text) {

    hidePanels();

    input.value = text;

    input.focus();

}


// ========================================
// NUEVO CHAT
// ========================================

function newChat() {

    messages = [];

    chat.innerHTML = `

        <div class="welcome">

            <div class="hero-logo">
                ✦
            </div>

            <h1>
                ¿Qué quieres crear hoy?
            </h1>

            <p>
                Habla, aprende, programa y crea
                con <strong>MORVIX AI</strong>.
            </p>

        </div>

    `;

    hidePanels();

    input.value = "";

    input.focus();

}


// ========================================
// LIMPIAR
// ========================================

function clearChat() {

    newChat();

}


// ========================================
// TEMA
// ========================================

function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );

    localStorage.setItem(
        "morvixTheme",
        document.body.classList.contains(
            "light"
        )
            ? "light"
            : "dark"
    );

}


// ========================================
// CARGAR TEMA
// ========================================

if (
    localStorage.getItem(
        "morvixTheme"
    ) === "light"
) {

    document.body.classList.add(
        "light"
    );

}


// ========================================
// SIDEBAR
// ========================================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


// ========================================
// FOCUS CHAT
// ========================================

function focusChat() {

    hidePanels();

    input.focus();

}


// ========================================
// INICIO
// ========================================

function showHome() {

    hidePanels();

    chat.classList.remove(
        "hidden"
    );

}


// ========================================
// OCULTAR PANELES
// ========================================

function hidePanels() {

    chat.classList.remove(
        "hidden"
    );

    imageCreator.classList.add(
        "hidden"
    );

    statsPanel.classList.add(
        "hidden"
    );

}


// ========================================
// CREADOR DE IMÁGENES
// ========================================

function showImageCreator() {

    chat.classList.add(
        "hidden"
    );

    statsPanel.classList.add(
        "hidden"
    );

    imageCreator.classList.remove(
        "hidden"
    );

    imagePrompt.focus();

}


function setImageStyle(style) {

    const current =
        imagePrompt.value.trim();

    imagePrompt.value =
        current
            ? `${current}, ${style}`
            : style;

    imagePrompt.focus();

}


// ========================================
// GENERAR IMAGEN
// ========================================

async function generateImage() {

    const prompt =
        imagePrompt.value.trim();

    const button =
        document.getElementById(
            "generateImage"
        );


    if (!prompt) {

        alert(
            "Escribe una descripción para la imagen."
        );

        return;

    }


    button.disabled = true;

    button.textContent =
        "✨ MORVIX está creando...";


    imageResult.innerHTML = `

        <div style="
            text-align:center;
            padding:30px;
            color:#999;
        ">

            🎨 Creando tu imagen...

            <br><br>

            <span>
                Esto puede tardar unos segundos.
            </span>

        </div>

    `;


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

                    body:
                        JSON.stringify({
                            prompt:
                                prompt
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "No se pudo crear la imagen."
            );

        }


        imageResult.innerHTML = `

            <img
                src="${data.image}"
                alt="Imagen generada por MORVIX AI"
            >

        `;


    } catch(error) {

        imageResult.innerHTML = `

            <div style="
                padding:20px;
                color:#f87171;
            ">

                ❌ ${escapeHTML(
                    error.message
                )}

            </div>

        `;

        console.error(error);

    }


    button.disabled = false;

    button.textContent =
        "✨ Crear imagen";

}


// ========================================
// ESTADÍSTICAS
// ========================================

async function registerVisit() {

    try {

        await fetch(
            "/api/visit",
            {
                method: "POST"
            }
        );

    } catch(error) {

        console.error(
            "No se pudo registrar visita.",
            error
        );

    }

}


async function showStats() {

    hidePanels();

    chat.classList.add(
        "hidden"
    );

    statsPanel.classList.remove(
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
            "statVisits"
        ).textContent =
            data.visits;


        document.getElementById(
            "statMessages"
        ).textContent =
            data.messages;


        document.getElementById(
            "statImages"
        ).textContent =
            data.imageGenerations;


        document.getElementById(
            "statActive"
        ).textContent =
            data.activeUsers;


    } catch(error) {

        console.error(
            "Error obteniendo estadísticas:",
            error
        );

    }

}


// ========================================
// CONFIGURACIÓN
// ========================================

function showAbout() {

    alert(

        "✦ MORVIX AI\n\n" +

        "Tu inteligencia. Sin límites.\n\n" +

        "Chat inteligente\n" +

        "Generación de imágenes\n" +

        "Programación\n" +

        "Modo estudio\n\n" +

        "Versión 2.0"

    );

}


// ========================================
// AUTO RESIZE
// ========================================

input.addEventListener(
    "input",
    autoResize
);


function autoResize() {

    input.style.height =
        "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            150
        ) + "px";

}
