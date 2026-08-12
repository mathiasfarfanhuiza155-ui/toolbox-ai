const express = require("express");

const app = express();

app.use(express.json());

app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/chat", async (req, res) => {
  try {

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "No está configurada GEMINI_API_KEY en Render."
      });
    }

    const messages = req.body.messages || [];

    if (!messages.length) {
      return res.status(400).json({
        error: "No se recibió ningún mensaje."
      });
    }

    const contents = messages.map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: message.content
        }
      ]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Eres MORVIX AI, un asistente inteligente, amable y útil. Responde principalmente en español. Ayuda con estudios, programación, creatividad, preguntas y tareas. Sé claro y no inventes información."
              }
            ]
          },

          contents: contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error("Error de Gemini:", data);

      return res.status(response.status).json({
        error: data.error?.message || "Error al conectar con Gemini."
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(500).json({
        error: "Gemini no devolvió ninguna respuesta."
      });
    }

    res.json({
      answer: answer
    });

  } catch (error) {

    console.error("Error del servidor:", error);

    res.status(500).json({
      error: "Error interno del servidor."
    });

  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MORVIX AI funcionando en el puerto ${PORT}`);
});
