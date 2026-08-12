const chat =
    document.getElementById("chat");

const input =
    document.getElementById("message");

const historyBox =
    document.getElementById("history");

const sendButton =
    document.getElementById("send");

const toolsMenu =
    document.getElementById("toolsMenu");

let messages = [];


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
// AUTO RESIZE
// ========================================

input.addEventListener(
    "input",
    function() {

        input.style.height = "auto";

        input.style.height =
            Math.min(
                input.scrollHeight,
                180
            ) + "px";

    }
);


// ========================================
// ENVIAR
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

    input.style.height = "40px";


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


    } catch (error) {

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
// CREAR MENSAJE
// ========================================

function addMessage(text, type) {

    const message =
        document.createElement("div");

    message.className =
        "message " + type;


    const icon =
        document.createElement("div");

    icon.className =
        "message-icon";


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


    historyBox.prepend(item);

}


// ========================================
// SUGERENCIAS
// ========================================

function suggest(text) {

    input.value = text;

    input.focus();

    input.style.height = "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            180
        ) + "px";

}


// ========================================
// NUEVO CHAT
// ========================================

function newChat() {

    messages = [];


    chat.innerHTML = `

        <div class="welcome">

            <div class="welcome-logo">
                <span>✦</span>
            </div>

            <h1>
                ¿En qué puedo ayudarte?
            </h1>

            <p>
                Pregunta, crea, aprende y descubre
                con <strong>MORVIX AI</strong>.
            </p>

            <div class="suggestions">

                <button onclick="suggest(
                    'Explícame qué es la inteligencia artificial de manera sencilla'
                )">

                    <div class="suggest-icon blue">
                        ✦
                    </div>

                    <div>
                        <strong>Explícame algo</strong>
                        <small>Aprende un concepto nuevo</small>
                    </div>

                </button>

                <button onclick="suggest(
                    'Dame ideas creativas para ganar dinero por internet'
                )">

                    <div class="suggest-icon green">
                        $
                    </div>

                    <div>
                        <strong>Dame ideas</strong>
                        <small>Encuentra nuevas posibilidades</small>
                    </div>

                </button>

                <button onclick="suggest(
                    'Ayúdame a crear una página web moderna'
                )">

                    <div class="suggest-icon purple">
                        &lt;/&gt;
                    </div>

                    <div>
                        <strong>Crear una web</strong>
                        <small>Programa con MORVIX</small>
                    </div>

                </button>

                <button onclick="suggest(
                    'Ayúdame con una tarea escolar'
                )">

                    <div class="suggest-icon orange">
                        ✎
                    </div>

                    <div>
                        <strong>Ayúdame a estudiar</strong>
                        <small>Aprende paso a paso</small>
                    </div>

                </button>

            </div>

        </div>
    `;


    input.value = "";

    input.style.height = "40px";

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
        "dark"
    );


    localStorage.setItem(
        "morvix-theme",
        document.body.classList.contains("dark")
            ? "dark"
            : "light"
    );

}


if (
    localStorage.getItem(
        "morvix-theme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
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
// CONFIGURACIÓN
// ========================================

function showAbout() {

    alert(
        "✦ MORVIX AI\n\n" +
        "Asistente de inteligencia artificial.\n\n" +
        "Versión 2.1"
    );

}


// ========================================
// ESTADÍSTICAS
// ========================================

async function showStats() {

    try {

        const response =
            await fetch(
                "/api/stats"
            );


        const data =
            await response.json();


        alert(

            "📊 ESTADÍSTICAS DE MORVIX\n\n" +

            "Visitas: " +
            data.visits +
            "\n\n" +

            "Mensajes: " +
            data.messages +
            "\n\n" +

            "Imágenes generadas: " +
            data.imageGenerations

        );


    } catch {

        alert(
            "No se pudieron cargar las estadísticas."
        );

    }

}


// ========================================
// BOTÓN +
// ========================================

function toggleTools() {

    toolsMenu.classList.toggle(
        "show"
    );

}


// ========================================
// CREAR IMAGEN
// ========================================

function createImageTool() {

    toolsMenu.classList.remove(
        "show"
    );


    input.value =
        "Crea una imagen de ";


    input.focus();

}


// ========================================
// SUBIR ARCHIVO
// ========================================

function uploadFile() {

    toolsMenu.classList.remove(
        "show"
    );


    document
        .getElementById("fileInput")
        .click();

}


document
    .getElementById("fileInput")
    .addEventListener(
        "change",
        function() {

            const file =
                this.files[0];

            if (!file) return;


            addMessage(
                "📎 Archivo seleccionado: " +
                file.name,
                "user"
            );

        }
    );


// ========================================
// IMAGEN
// ========================================

function uploadImage() {

    toolsMenu.classList.remove(
        "show"
    );


    document
        .getElementById("imageInput")
        .click();

}


document
    .getElementById("imageInput")
    .addEventListener(
        "change",
        function() {

            const file =
                this.files[0];

            if (!file) return;


            addMessage(
                "🖼️ Imagen seleccionada: " +
                file.name,
                "user"
            );

        }
    );


// ========================================
// WEB
// ========================================

function webSearchTool() {

    toolsMenu.classList.remove(
        "show"
    );


    alert(
        "🌐 La búsqueda web se añadirá próximamente."
    );

}


// ========================================
// CERRAR MENÚ
// ========================================

document.addEventListener(
    "click",
    function(event) {

        const plus =
            document.getElementById(
                "plusButton"
            );


        if (
            toolsMenu &&
            plus &&
            !toolsMenu.contains(
                event.target
            ) &&
            !plus.contains(
                event.target
            )
        ) {

            toolsMenu.classList.remove(
                "show"
            );

        }

    }
);


// ========================================
// VISITA
// ========================================

fetch(
    "/api/visit",
    {
        method: "POST"
    }
).catch(
    () => {}
);
