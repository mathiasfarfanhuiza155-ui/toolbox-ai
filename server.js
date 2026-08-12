const express = require("express");
const path = require("path");
const multer = require("multer");

const app = express();

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL = "gemini-3.5-flash-lite";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

app.use(express.json({ limit: "25mb" }));

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});


app.post(
  "/api/chat",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!GEMINI_API_KEY) {
        return res.status(500).json({
          error:
            "No está configurada GEMINI_API_KEY en Render."
        });
      }


      const messages = JSON.parse(
        req.body.messages || "[]"
      );


      if (!messages.length) {
        return res.status(400).json({
          error:
            "No se recibió ningún mensaje."
        });
      }


      const contents = [];


      for (const message of messages) {

        const role =
          message.role === "assistant"
            ? "model"
            : "user";


        contents.push({
          role: role,
          parts: [
            {
              text: message.content
            }
          ]
        });

      }


      // Si el usuario subió un archivo,
      // lo agregamos al último mensaje.
      if (req.file) {

        const lastMessage =
          contents[contents.length - 1];

        const base64 =
          req.file.buffer.toString("base64");


        lastMessage.parts.push({

          inlineData: {
            mimeType:
              req.file.mimetype ||
              "application/octet-stream",

            data: base64
          }

        });

      }


      const response = await fetch(

        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,

        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            systemInstruction: {

              parts: [

                {
                  text: `
Eres MORVIX AI.

Tu personalidad:
- Inteligente
- Amable
- Moderna
- Clara
- Directa
- Creativa
- Paciente

Responde principalmente en español.

Ayuda con:
- Estudios
- Matemáticas
- Ciencia
- Programación
- HTML
- CSS
- JavaScript
- Python
- Ideas
- Escritura
- Resúmenes
- Explicaciones
- Análisis de imágenes
- Análisis de documentos

Cuando escribas código:
- Usa bloques de código Markdown.
- Indica el lenguaje.
- Explica brevemente qué hace.

Cuando el usuario mande una imagen o documento:
- Analízalo cuidadosamente.
- Si contiene texto, intenta leerlo.
- Si no puedes determinar algo, dilo claramente.
- No inventes información.

No reveles claves API ni información interna del servidor.

Tu nombre es MORVIX AI.
                  `
                }

              ]

            },

            contents: contents

          })

        }

      );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          "Error de Gemini:",
          data
        );


        return res.status(
          response.status
        ).json({

          error:
            data.error?.message ||
            "Error de Gemini."

        });

      }


      const answer =
        data
          .candidates?.[0]
          ?.content?.parts
          ?.filter(part => part.text)
          ?.map(part => part.text)
          ?.join("\n") ||
        "No recibí una respuesta.";


      res.json({
        answer: answer
      });


    } catch (error) {

      console.error(
        "ERROR DEL SERVIDOR:",
        error
      );


      res.status(500).json({

        error:
          "Ocurrió un error interno en MORVIX AI."

      });

    }

  }
);


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `MORVIX AI funcionando en el puerto ${PORT}`
    );

  }
);
