const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "10mb" }));

// Servir los archivos de la carpeta public
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// MODELOS
// ========================================

const CHAT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image";

// ========================================
// ESTADÍSTICAS
// ========================================

let stats = {
    visits: 0,
    messages: 0,
    imageGenerations: 0,
    activeUsers: 0
};

// ========================================
// ESTADÍSTICAS
// ========================================

app.get("/api/stats", (req, res) => {

    res.json({
        visits: stats.visits,
        messages: stats.messages,
        imageGenerations: stats.imageGenerations,
        activeUsers: stats.activeUsers
    });

});

// ========================================
// REGISTRAR VISITA
// ========================================

app.post("/api/visit", (req, res) => {

    stats.visits++;
    stats.activeUsers++;

    res.json({
        success: true
    });

});

// ========================================
// CHAT CON GEMINI
// ========================================

app.post("/api/chat", async (req, res) => {

    try {

        if (!GEMINI_API_KEY) {

            return res.status(500).json({
                error: "GEMINI_API_KEY no está configurada en Render."
            });

        }

        const messages = req.body.messages;

        if (!Array.isArray(messages)) {

            return res.status(400).json({
                error: "Formato de mensajes inválido."
            });

        }

        stats.messages++;

        const contents = messages.map((message) => {

            return {
                role:
                    message.role === "assistant"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text: String(
                            message.content || ""
                        )
                    }
                ]
            };

        });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    systemInstruction: {

                        parts: [

                            {
                                text: `
Eres MORVIX AI.

Tu nombre es MORVIX AI.

Eres un asistente inteligente, moderno, amable, creativo y útil.

Responde en español salvo que el usuario solicite otro idioma.

Ayuda al usuario con:

- preguntas generales
- tareas escolares
- matemáticas
- programación
- creación de páginas web
- ideas creativas
- escritura
- explicaciones
- tecnología
- proyectos

Tus respuestas deben ser claras y fáciles de leer.

Utiliza Markdown cuando sea útil.

Puedes utilizar:

- títulos
- subtítulos
- listas
- negrita
- ejemplos
- código
- tablas

Cuando escribas código, utiliza bloques de código.

No inventes información cuando no estés seguro.

Nunca reveles la API Key ni información privada del servidor.

Tu identidad es MORVIX AI.
`
                            }

                        ]

                    },

                    contents: contents,

                    generationConfig: {

                        temperature: 0.8,

                        maxOutputTokens: 4096

                    }

                })

            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "Error de Gemini:",
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

            return res.status(response.status).json({

                error:
                    data?.error?.message ||
                    "Error de Gemini."

            });

        }

        const answer =
            data?.candidates?.[0]?.content?.parts
                ?.map(
                    (part) =>
                        part.text || ""
                )
                .join("")
                .trim();

        if (!answer) {

            return res.status(500).json({

                error:
                    "Gemini no devolvió ninguna respuesta."

            });

        }

        res.json({

            answer: answer

        });

    } catch (error) {

        console.error(
            "Error del servidor:",
            error
        );

        res.status(500).json({

            error:
                "MORVIX AI tuvo un problema al conectarse con Gemini."

        });

    }

});

// ========================================
// GENERACIÓN DE IMÁGENES
// ========================================

app.post("/api/image", async (req, res) => {

    try {

        if (!GEMINI_API_KEY) {

            return res.status(500).json({

                error:
                    "GEMINI_API_KEY no está configurada en Render."

            });

        }

        const prompt =
            String(
                req.body.prompt || ""
            ).trim();

        if (!prompt) {

            return res.status(400).json({

                error:
                    "Escribe una descripción para la imagen."

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
                        IMAGE_MODEL,

                    input:
                        prompt,

                    response_format: {

                        type:
                            "image",

                        aspect_ratio:
                            "1:1",

                        image_size:
                            "1K"

                    }

                })

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(

                "Error de generación de imagen:",

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
                    "No se pudo generar la imagen."

            });

        }

        let imageData = null;

        let mimeType =
            "image/png";


        // Buscar imagen en output
        if (
            Array.isArray(
                data.output
            )
        ) {

            for (
                const step
                of data.output
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

                            item.type ===
                                "image" &&

                            item.data

                        ) {

                            imageData =
                                item.data;

                            mimeType =
                                item.mime_type ||
                                item.mimeType ||
                                "image/png";

                        }

                    }

                }

                if (

                    step.type ===
                        "image" &&

                    step.data

                ) {

                    imageData =
                        step.data;

                    mimeType =
                        step.mime_type ||
                        step.mimeType ||
                        "image/png";

                }

            }

        }


        // Compatibilidad adicional
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

                "Gemini no devolvió una imagen:",

                JSON.stringify(
                    data,
                    null,
                    2
                )

            );

            return res.status(500).json({

                error:
                    "Gemini respondió pero no encontramos la imagen."

            });

        }


        res.json({

            success: true,

            image:
                `data:${mimeType};base64,${imageData}`

        });

    } catch (error) {

        console.error(
            "Error de imagen:",
            error
        );

        res.status(500).json({

            error:
                "MORVIX no pudo generar la imagen."

        });

    }

});

// ========================================
// PÁGINA PRINCIPAL
// ========================================

// IMPORTANTE:
// No usamos app.get("*") porque Express 5
// produce el error PathError.

app.use((req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            "public",
            "index.html"
        )

    );

});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(
    PORT,
    () => {

        console.log(
            `✦ MORVIX AI funcionando en el puerto ${PORT}`
        );

    }
);
