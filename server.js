const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "10mb" }));

// ==========================================
// ARCHIVOS DE LA WEB
// ==========================================

app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// CONFIGURACIÓN DE MORVIX
// ==========================================

const MODEL = "gemini-3.6-flash";

// ==========================================
// ESTADÍSTICAS
// ==========================================

let stats = {
    visits: 0,
    messages: 0,
    imageGenerations: 0
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

app.get("/api/stats", (req, res) => {

    res.json(stats);

});

// ==========================================
// REGISTRAR VISITA
// ==========================================

app.post("/api/visit", (req, res) => {

    stats.visits++;

    res.json({
        success: true
    });

});

// ==========================================
// CHAT MORVIX AI
// ==========================================

app.post("/api/chat", async (req, res) => {

    try {

        if (!GEMINI_API_KEY) {

            return res.status(500).json({
                error:
                    "No se encontró GEMINI_API_KEY en Render."
            });

        }

        const messages = req.body.messages;

        if (!Array.isArray(messages)) {

            return res.status(400).json({
                error:
                    "Los mensajes enviados no son válidos."
            });

        }

        stats.messages++;

        // ======================================
        // CONVERTIR EL HISTORIAL
        // ======================================

        let conversation = messages
            .map(message => {

                const role =
                    message.role === "assistant"
                        ? "model"
                        : "user";

                return `${role}: ${message.content}`;

            })
            .join("\n\n");


        // ======================================
        // INSTRUCCIONES DE MORVIX
        // ======================================

        const systemInstruction = `
Eres MORVIX AI.

Tu nombre es MORVIX AI.

Eres una inteligencia artificial moderna,
rápida, creativa, amable y útil.

Responde principalmente en español.

Puedes ayudar con:

- tareas escolares
- matemáticas
- ciencia
- programación
- HTML
- CSS
- JavaScript
- creación de páginas web
- tecnología
- ideas de negocios
- escritura
- creatividad
- explicaciones
- proyectos
- preguntas generales

Tus respuestas deben ser claras,
bien organizadas y fáciles de entender.

Utiliza Markdown cuando sea conveniente.

Puedes utilizar:

# Títulos

## Subtítulos

**Negrita**

- Listas

1. Listas numeradas

También puedes utilizar bloques de código.

Cuando el usuario pida código,
proporciona código completo y funcional.

No inventes información.

Si no sabes algo, dilo claramente.

Nunca muestres la API Key.

Nunca reveles información privada del servidor.

Tu identidad es MORVIX AI.
`;


        // ======================================
        // INTERACTIONS API
        // ======================================

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },

                body: JSON.stringify({

                    model: MODEL,

                    system_instruction:
                        systemInstruction,

                    input: conversation,

                    store: false

                })
            }
        );


        const data = await response.json();


        // ======================================
        // ERROR DE GEMINI
        // ======================================

        if (!response.ok) {

            console.error(
                "ERROR GEMINI:",
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "Error desconocido de Gemini."

            });

        }


        // ======================================
        // OBTENER RESPUESTA
        // ======================================

        let answer = "";


        // Forma recomendada
        if (
            typeof data.output_text === "string"
        ) {

            answer =
                data.output_text;

        }


        // Compatibilidad con respuestas
        // estructuradas
        if (
            !answer &&
            Array.isArray(data.steps)
        ) {

            for (
                const step
                of data.steps
            ) {

                if (
                    Array.isArray(
                        step.content
                    )
                ) {

                    for (
                        const content
                        of step.content
                    ) {

                        if (
                            content.type === "text"
                        ) {

                            answer +=
                                content.text || "";

                        }

                    }

                }

            }

        }


        // ======================================
        // COMPROBAR RESPUESTA
        // ======================================

        if (!answer.trim()) {

            console.error(
                "Respuesta completa de Gemini:",
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

            return res.status(500).json({

                error:
                    "Gemini no devolvió texto."

            });

        }


        // ======================================
        // RESPUESTA
        // ======================================

        res.json({

            answer:
                answer.trim()

        });


    } catch (error) {

        console.error(
            "ERROR DEL SERVIDOR:",
            error
        );

        res.status(500).json({

            error:
                "MORVIX AI no pudo conectarse con Gemini."

        });

    }

});

// ==========================================
// GENERACIÓN DE IMÁGENES
// ==========================================

app.post("/api/image", async (req, res) => {

    try {

        if (!GEMINI_API_KEY) {

            return res.status(500).json({

                error:
                    "No se encontró GEMINI_API_KEY."

            });

        }

        const prompt =
            String(
                req.body.prompt || ""
            ).trim();


        if (!prompt) {

            return res.status(400).json({

                error:
                    "Escribe qué imagen quieres crear."

            });

        }


        stats.imageGenerations++;


        const response = await fetch(

            "https://generativelanguage.googleapis.com/v1beta/interactions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        GEMINI_API_KEY

                },

                body: JSON.stringify({

                    model:
                        "gemini-3.1-flash-image",

                    input:
                        prompt,

                    response_format: {

                        type: "image",

                        aspect_ratio:
                            "1:1",

                        image_size:
                            "1K"

                    },

                    store: false

                })

            }

        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(

                "ERROR IMAGEN:",

                JSON.stringify(
                    data,
                    null,
                    2
                )

            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "No se pudo crear la imagen."

            });

        }


        let imageData = null;
        let mimeType = "image/png";


        // ======================================
        // BUSCAR IMAGEN
        // ======================================

        if (
            Array.isArray(
                data.steps
            )
        ) {

            for (
                const step
                of data.steps
            ) {

                if (
                    Array.isArray(
                        step.content
                    )
                ) {

                    for (
                        const item
                        of step.content
                    ) {

                        if (
                            item.type === "image"
                        ) {

                            imageData =
                                item.data ||
                                item.image ||
                                item.base64 ||
                                null;

                            mimeType =
                                item.mime_type ||
                                item.mimeType ||
                                "image/png";
                        }

                    }

                }

            }

        }


        // Compatibilidad
        if (
            !imageData &&
            data.output_image
        ) {

            imageData =
                data.output_image.data;

            mimeType =
                data.output_image.mime_type ||
                "image/png";

        }


        if (!imageData) {

            console.error(

                "Gemini no devolvió imagen:",

                JSON.stringify(
                    data,
                    null,
                    2
                )

            );

            return res.status(500).json({

                error:
                    "La IA respondió pero no encontramos la imagen."

            });

        }


        res.json({

            success: true,

            image:
                `data:${mimeType};base64,${imageData}`

        });


    } catch (error) {

        console.error(
            "ERROR IMAGEN:",
            error
        );

        res.status(500).json({

            error:
                "MORVIX no pudo generar la imagen."

        });

    }

});

// ==========================================
// SERVIR INDEX.HTML
// ==========================================

app.use((req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 MORVIX AI funcionando en el puerto ${PORT}`
        );

        console.log(
            `🤖 Modelo: ${MODEL}`
        );

    }
);
