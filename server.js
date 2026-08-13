const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "10mb" }));

// Servir la carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Comprobar que el servidor está funcionando
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        message: "MORVIX AI funcionando correctamente"
    });
});

// Modelos configurados
app.get("/api/models", (req, res) => {
    res.json({
        models: [
            "gemini"
        ]
    });
});

// Chat de MORVIX
app.post("/api/chat", async (req, res) => {

    try {

        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: "No se recibieron mensajes"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Falta configurar GEMINI_API_KEY en Render"
            });
        }

        const userMessage =
            messages[messages.length - 1]?.content || "";

        // Aquí irá la conexión con el proveedor de IA.
        // No colocamos la API key en el navegador.

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text:
                                        "Eres MORVIX AI, un asistente útil, moderno y amigable. Responde en español cuando el usuario escriba en español.\n\nUsuario: " +
                                        userMessage
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error("Error de Gemini:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Error al conectar con Gemini"
            });
        }

        const answer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No pude generar una respuesta.";

        res.json({
            answer
        });

    } catch (error) {

        console.error("Error del servidor:", error);

        res.status(500).json({
            error: "MORVIX no pudo conectarse con la IA"
        });
    }
});

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, () => {
    console.log(
        `MORVIX AI funcionando en el puerto ${PORT}`
    );
});
