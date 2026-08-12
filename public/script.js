const chat =
    document.getElementById("chat");

const input =
    document.getElementById("message");

const sendButton =
    document.getElementById("send");

const historyBox =
    document.getElementById("history");

const toolsMenu =
    document.getElementById("toolsMenu");

const plusButton =
    document.getElementById("plusButton");

const fileInput =
    document.getElementById("fileInput");

const imageInput =
    document.getElementById("imageInput");


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

        this.style.height = "auto";

        this.style.height =
            Math.min(
                this.scrollHeight,
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


    removeWelcome();


    addUserMessage(text);


    messages.push({

        role: "user",

        content: text

    });


    addHistory(text);


    input.value = "";

    input.style.height = "40px";


    const typing =
        addTyping();


    sendButton.disabled =
        true;


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method:
                        "POST",

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


        typing.remove();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Error del servidor"
            );

        }


        await addAIMessage(
            data.answer || "No recibí una respuesta."
        );


        messages.push({

            role:
                "assistant",

            content:
                data.answer

        });


    } catch(error) {

        typing.remove();


        addAIMessage(
            "❌ **MORVIX no pudo conectarse con la IA.**\n\n" +
            error.message
        );


        console.error(error);

    }


    sendButton.disabled =
        false;

    input.focus();

}


// ========================================
// USUARIO
// ========================================

function addUserMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message user";


    message.innerHTML = `

        <div class="message-icon">
            M
        </div>

        <div class="message-content"></div>

    `;


    message
        .querySelector(".message-content")
        .textContent = text;


    chat.appendChild(message);

    scrollBottom();

}


// ========================================
// IA
// ========================================

async function addAIMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message ai";


    message.innerHTML = `

        <div class="message-icon">
            ✦
        </div>

        <div>

            <div class="message-content"></div>

            <div class="answer-tools">

                <button
                    class="copy-answer"
                    onclick="copyAnswer(this)"
                >
                    📋 Copiar
                </button>

            </div>

        </div>

    `;


    chat.appendChild(message);


    const content =
        message.querySelector(
            ".message-content"
        );


    await typeMarkdown(
        content,
        text
    );


    scrollBottom();

}


// ========================================
// TYPING
// ========================================

function addTyping() {

    const message =
        document.createElement("div");

    message.className =
        "message ai";


    message.innerHTML = `

        <div class="message-icon">
            ✦
        </div>

        <div class="typing">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;


    chat.appendChild(message);

    scrollBottom();


    return message;

}


// ========================================
// MARKDOWN
// ========================================

async function typeMarkdown(
    element,
    text
) {

    const html =
        markdownToHTML(text);


    const temporary =
        document.createElement("div");

    temporary.innerHTML =
        html;


    const plain =
        temporary.textContent || "";


    element.innerHTML = "";


    if (
        text.includes("```")
    ) {

        element.innerHTML =
            html;

        activateCodeButtons();

        return;

    }


    for (
        let i = 0;
        i < plain.length;
        i++
    ) {

        element.textContent =
            plain.substring(
                0,
                i + 1
            );

        scrollBottom();

        await sleep(8);

    }


    element.innerHTML =
        html;

}


// ========================================
// MARKDOWN SIMPLE
// ========================================

function markdownToHTML(text) {

    let safe =
        escapeHTML(text);


    const codeBlocks = [];


    safe =
        safe.replace(
            /```(\w*)\n?([\s\S]*?)```/g,
            function(
                match,
                language,
                code
            ) {

                const id =
                    "code-" +
                    Date.now() +
                    "-" +
                    codeBlocks.length;


                codeBlocks.push({
                    id,
                    language:
                        language ||
                        "code",
                    code
                });


                return `

                    <div class="code-block">

                        <div class="code-header">

                            <span>
                                ${language || "código"}
                            </span>

                            <button
                                class="copy-code"
                                data-code-id="${id}"
                            >
                                Copiar
                            </button>

                        </div>

                        <pre>
                            <code id="${id}">
                                ${code}
                            </code>
                        </pre>

                    </div>

                `;

            }
        );


    safe =
        safe.replace(
            /^### (.*)$/gm,
            "<h3>$1</h3>"
        );


    safe =
        safe.replace(
            /^## (.*)$/gm,
            "<h2>$1</h2>"
        );


    safe =
        safe.replace(
            /^# (.*)$/gm,
            "<h1>$1</h1>"
        );


    safe =
        safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    safe =
        safe.replace(
            /`([^`]+)`/g,
            '<span class="inline-code">$1</span>'
        );


    safe =
        safe.replace(
            /^[-*] (.*)$/gm,
            "<li>$1</li>"
        );


    safe =
        safe.replace(
            /(<li>.*<\/li>)/gs,
            "<ul>$1</ul>"
        );


    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );


    return safe;

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


// ========================================
// COPIAR RESPUESTA
// ========================================

async function copyAnswer(button) {

    const message =
        button
            .closest(".message");

    const content =
        message
            .querySelector(
                ".message-content"
            );


    await navigator.clipboard.writeText(
        content.innerText
    );


    const old =
        button.textContent;


    button.textContent =
        "✓ Copiado";


    setTimeout(
        () => {

            button.textContent =
                old;

        },
        1500
    );

}


// ========================================
// COPIAR CÓDIGO
// ========================================

function activateCodeButtons() {

    document
        .querySelectorAll(
            ".copy-code"
        )
        .forEach(button => {

            button.onclick =
                async function() {

                    const id =
                        this.dataset.codeId;

                    const code =
                        document
                            .getElementById(id)
                            .innerText;


                    await navigator
                        .clipboard
                        .writeText(code);


                    this.textContent =
                        "✓ Copiado";


                    setTimeout(
                        () => {

                            this.textContent =
                                "Copiar";

                        },
                        1500
                    );

                };

        });

}


// ========================================
// NUEVO CHAT
// ========================================

function newChat() {

    messages = [];


    chat.innerHTML = `

        <div class="welcome">

            <div class="hero-logo">
                <span>✦</span>
            </div>

            <h1>
                ¿En qué puedo ayudarte?
            </h1>

            <p>
                Pregunta, crea, aprende y descubre
                con <strong>MORVIX AI</strong>.
            </p>

            <div class="cards">

                <button onclick="suggest(
                    'Explícame la inteligencia artificial de manera sencilla'
                )">
                    🧠
                    <div>
                        <strong>Explícame algo</strong>
                        <small>Aprende cualquier concepto</small>
                    </div>
                </button>

                <button onclick="suggest(
                    'Dame ideas creativas para un proyecto'
                )">
                    💡
                    <div>
                        <strong>Dame ideas</strong>
                        <small>Crea algo nuevo</small>
                    </div>
                </button>

                <button onclick="suggest(
                    'Ayúdame a crear una página web moderna'
                )">
                    💻
                    <div>
                        <strong>Programar</strong>
                        <small>Crea código y páginas web</small>
                    </div>
                </button>

                <button onclick="suggest(
                    'Ayúdame con una tarea escolar'
                )">
                    📚
                    <div>
                        <strong>Estudiar</strong>
                        <small>Aprende paso a paso</small>
                    </div>
                </button>

            </div>

        </div>

    `;


    input.value = "";

    input.style.height =
        "40px";

    input.focus();

}


// ========================================
// LIMPIAR
// ========================================

function clearChat() {

    newChat();

}


// ========================================
// SUGERIR
// ========================================

function suggest(text) {

    input.value =
        text;

    input.focus();

    input.style.height =
        "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            180
        ) + "px";

}


// ========================================
// TEMA
// ========================================

function toggleTheme() {

    document.body
        .classList
        .toggle("dark");


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

    document.body
        .classList
        .add("dark");

}


// ========================================
// SIDEBAR
// ========================================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList
        .toggle("open");

}


// ========================================
// HERRAMIENTAS
// ========================================

function toggleTools() {

    toolsMenu
        .classList
        .toggle("show");

}


document.addEventListener(
    "click",
    function(event) {

        if (
            toolsMenu &&
            !toolsMenu.contains(event.target) &&
            !plusButton.contains(event.target)
        ) {

            toolsMenu
                .classList
                .remove("show");

        }

    }
);


// ========================================
// CREAR IMAGEN
// ========================================

function createImage() {

    toolsMenu
        .classList
        .remove("show");


    input.value =
        "Crea una imagen de ";


    input.focus();

}


// ========================================
// ARCHIVOS
// ========================================

function chooseFile() {

    toolsMenu
        .classList
        .remove("show");


    fileInput.click();

}


fileInput.addEventListener(
    "change",
    function() {

        if (!this.files.length)
            return;


        const file =
            this.files[0];


        addUserMessage(
            "📎 Archivo seleccionado: " +
            file.name
        );

    }
);


// ========================================
// IMÁGENES
// ========================================

function chooseImage() {

    toolsMenu
        .classList
        .remove("show");


    imageInput.click();

}


imageInput.addEventListener(
    "change",
    function() {

        if (!this.files.length)
            return;


        const file =
            this.files[0];


        addUserMessage(
            "🖼️ Imagen seleccionada: " +
            file.name
        );

    }
);


// ========================================
// WEB
// ========================================

function searchWeb() {

    toolsMenu
        .classList
        .remove("show");


    input.value =
        "Busca en internet información sobre ";


    input.focus();

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


        if (!response.ok)
            throw new Error();


        const data =
            await response.json();


        alert(

            "📊 ESTADÍSTICAS MORVIX\n\n" +

            "👥 Usuarios/visitas: " +
            (data.visits ?? 0) +

            "\n\n💬 Mensajes: " +
            (data.messages ?? 0) +

            "\n\n🎨 Imágenes: " +
            (data.imageGenerations ?? 0)

        );

    } catch {

        alert(
            "Las estadísticas todavía no están disponibles en el servidor."
        );

    }

}


// ========================================
// CONFIGURACIÓN
// ========================================

function showAbout() {

    alert(

        "✦ MORVIX AI\n\n" +

        "Tu asistente inteligente.\n\n" +

        "Versión 3.0"

    );

}


// ========================================
// UTILIDADES
// ========================================

function removeWelcome() {

    const welcome =
        document.getElementById(
            "welcome"
        );

    if (welcome) {

        welcome.remove();

    }

}


function scrollBottom() {

    chat.scrollTop =
        chat.scrollHeight;

}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}
