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
// ENTER PARA ENVIAR
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
// AJUSTAR TEXTAREA
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
            "MORVIX AI está pensando...",
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

            "❌ MORVIX AI no pudo conectarse con la IA.\n\n" +
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

}


// ========================================
// NUEVO CHAT
// ========================================

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

                <button
                    onclick="suggest('Explícame qué es la inteligencia artificial')"
                >
                    🧠 Explícame algo
                </button>

                <button
                    onclick="suggest('Dame ideas para ganar dinero por internet')"
                >
                    💰 Dame ideas
                </button>

                <button
                    onclick="suggest('Ayúdame a crear una página web')"
                >
                    💻 Crear una web
                </button>

                <button
                    onclick="suggest('Ayúdame con una tarea escolar')"
                >
                    📚 Ayúdame a estudiar
                </button>

            </div>

        </div>

    `;


    input.value = "";

    input.style.height = "40px";

    input.focus();

}


// ========================================
// LIMPIAR CHAT
// ========================================

function clearChat() {

    newChat();

}


// ========================================
// CAMBIAR TEMA
// ========================================

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


// ========================================
// RECUPERAR TEMA
// ========================================

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
        .querySelector(".sidebar")
        .classList.toggle(
            "open"
        );

}


// ========================================
// CONFIGURACIÓN
// ========================================

function showAbout() {

    alert(

        "✦ MORVIX AI\n\n" +

        "Tu asistente inteligente.\n\n" +

        "Chat • Creatividad • Programación • " +
        "Imágenes\n\n" +

        "Versión 2.1"

    );

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
// GENERAR IMAGEN REAL
// ========================================

async function generateImage(
    prompt
) {

    const thinking =
        addMessage(
            "🎨 MORVIX está creando tu imagen...",
            "ai"
        );


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


        thinking.remove();


        if (!response.ok) {

            throw new Error(

                data.error ||
                "No se pudo crear la imagen."

            );

        }


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message ai";


        const icon =
            document.createElement(
                "div"
            );


        icon.className =
            "message-icon ai-icon";


        icon.textContent =
            "✦";


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "message-content";


        const title =
            document.createElement(
                "div"
            );


        title.textContent =
            "🎨 Imagen creada por MORVIX AI";


        title.style.fontWeight =
            "700";


        title.style.marginBottom =
            "10px";


        const image =
            document.createElement(
                "img"
            );


        image.src =
            data.image;


        image.alt =
            prompt;


        image.style.width =
            "100%";


        image.style.maxWidth =
            "700px";


        image.style.borderRadius =
            "16px";


        image.style.display =
            "block";


        content.appendChild(title);

        content.appendChild(image);

        message.appendChild(icon);

        message.appendChild(content);

        chat.appendChild(message);


        chat.scrollTop =
            chat.scrollHeight;


    } catch (error) {

        thinking.remove();


        addMessage(

            "❌ No pude crear la imagen.\n\n" +
            error.message,

            "ai"

        );


        console.error(error);

    }

}


// ========================================
// ARCHIVOS
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


            if (!file) {
                return;
            }


            addMessage(

                `📎 Archivo seleccionado: ${file.name}`,

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


            if (!file) {
                return;
            }


            addMessage(

                `🖼️ Imagen seleccionada: ${file.name}`,

                "user"

            );

        }
    );


// ========================================
// BÚSQUEDA WEB
// ========================================

function webSearchTool() {

    toolsMenu.classList.remove(
        "show"
    );


    alert(
        "🌐 La búsqueda web se añadirá en una próxima versión."
    );

}


// ========================================
// CERRAR MENÚ +
// ========================================

document.addEventListener(

    "click",

    function(event) {

        const button =
            document.getElementById(
                "plusButton"
            );


        if (

            toolsMenu &&
            button &&

            !toolsMenu.contains(
                event.target
            ) &&

            !button.contains(
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
// REGISTRAR VISITA
// ========================================

fetch(
    "/api/visit",
    {
        method: "POST"
    }
).catch(
    () => {}
);
