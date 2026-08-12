const express = require("express");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT || 10000;

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


app.use(
    express.json({
        limit: "10mb"
    })
);


app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ==========================================
// MODELO
// ==========================================

const MODEL =
    "gemini-3.6-flash";


// ==========================================
// ESTADÍSTICAS
// ==========================================

let stats = {

    visits: 0,

    messages: 0,

    imageGenerations: 0

};


// ==========================================
// STATS
// ==========================================

app.get(
    "/api/stats",
    (req, res) => {

        res.json(stats);

    }
);


// ==========================================
// VISITA
// ==========================================

app.post(
    "/api/visit",
    (req, res) => {

        stats.visits++;

        res.json({

            success: true

        });

    }
);


// ==========================================
// CHAT
// ==========================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            if (!GEMINI_API_KEY) {

                return res.status(500).json({

                    error:
                        "GEMINI_API_KEY no está configurada en Render."

                });

            }


            const messages =
                req.body.messages;


            if (
                !Array.isArray(
                    messages
                )
            ) {

                return res.status(400).json({

                    error:
                        "Mensajes inválidos."

                });

            }


            stats.messages++;


            const conversation =
                messages
                    .map(
                        message => {

                            const role =
                                message.role ===
                                "assistant"
                                    ? "model"
                                    : "user";


                            return (
                                role +
                                ": " +
                                String(
                                    message.content ||
                                    ""
                                )
                            );

                        }
                    )
                    .join("\n\n");


            const systemInstruction = `

Eres MORVIX AI.

Tu nombre es MORVIX AI.

Eres una inteligencia artificial moderna,
rápida, creativa, amable y útil.

Responde principalmente en español.

Ayuda al usuario con:

- tareas escolares
- matemáticas
- ciencia
- programación
- HTML
- CSS
- JavaScript
- páginas web
- tecnología
- creatividad
- escritura
- proyectos
- preguntas generales

Tus respuestas deben ser claras,
organizadas y fáciles de entender.

Usa Markdown cuando sea útil.

Cuando escribas código,
proporciona código completo y funcional.

No inventes información.

No reveles API Keys,
datos privados ni información
del servidor.

Tu identidad es MORVIX AI.

`;


            const response =
                await fetch(

                    "https://generativelanguage.googleapis.com/v1beta/interactions",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify({

                                model:
                                    MODEL,

                                system_instruction:
                                    systemInstruction,

                                input:
                                    conversation,

                                store:
                                    false

                            })

                    }

                );


            const data =
                await response.json();


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
                        "Error de Gemini."

                });

            }


            let answer = "";


            if (
                typeof
                data.output_text ===
                "string"
            ) {

                answer =
                    data.output_text;

            }


            if (
                !answer &&
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
                            const content
                            of step.content
                        ) {

                            if (
                                content.type ===
                                "text"
                            ) {

                                answer +=
                                    content.text ||
                                    "";

                            }

                        }

                    }

                }

            }


            if (
                !answer.trim()
            ) {

                return res.status(500).json({

                    error:
                        "Gemini no devolvió texto."

                });

            }


            res.json({

                answer:
                    answer.trim()

            });


        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                error:
                    "MORVIX AI no pudo conectarse con Gemini."

            });

        }

    }
);


// ==========================================
// IMÁGENES
// ==========================================

app.post(
    "/api/image",
    async (req, res) => {

        try {

            if (!GEMINI_API_KEY) {

                return res.status(500).json({

                    error:
                        "GEMINI_API_KEY no está configurada."

                });

            }


            const prompt =
                String(
                    req.body.prompt ||
                    ""
                ).trim();


            if (!prompt) {

                return res.status(400).json({

                    error:
                        "Escribe qué imagen quieres crear."

                });

            }


            stats.imageGenerations++;


            const response =
                await fetch(

                    "https://generativelanguage.googleapis.com/v1beta/interactions",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify({

                                model:
                                    "gemini-3.1-flash-image",

                                input:
                                    prompt,

                                response_format: {

                                    type:
                                        "image",

                                    aspect_ratio:
                                        "1:1",

                                    image_size:
                                        "1K"

                                },

                                store:
                                    false

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
                        "No se pudo generar la imagen."

                });

            }


            let imageData =
                null;


            let mimeType =
                "image/png";


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
                                item.type ===
                                "image"
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

                return res.status(500).json({

                    error:
                        "La IA respondió pero no encontramos la imagen."

                });

            }


            res.json({

                success:
                    true,

                image:
                    `data:${mimeType};base64,${imageData}`

            });


        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                error:
                    "MORVIX no pudo generar la imagen."

            });

        }

    }
);


// ==========================================
// INDEX
// ==========================================

app.use(
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "public",
                "index.html"
            )

        );

    }
);


// ==========================================
// SERVIDOR
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            "🚀 MORVIX AI funcionando en el puerto " +
            PORT
        );

        console.log(
            "🤖 Modelo: " +
            MODEL
        );

    }
);
