const express = require("express");
const path = require("path");
const multer = require("multer");

const app = express();

const PORT = process.env.PORT || 10000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

/* =========================
   ARCHIVOS DE LA WEB
========================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   ESTADÍSTICAS
========================= */

let statistics = {
  visitors: 0,
  messages: 0,
  images: 0,
  files: 0
};

app.get("/api/stats", (req, res) => {
  res.json(statistics);
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "MORVIX AI",
    geminiConfigured: !!GEMINI_API_KEY,
    textModel: TEXT_MODEL,
    imageModel: IMAGE_MODEL
  });
});

app.get("/api/models", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY no está configurada en Render."
    });
  }

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const models = (data.models || []).map(model => ({
      name: model.name,
      displayName: model.displayName,
      description: model.description,
      methods: model.supportedGenerationMethods || []
    }));

    res.json({
      models
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudieron consultar los modelos."
    });
  }
});

/* =========================
   VISITAS
========================= */

app.get("/", (req, res) => {

  statistics.visitors++;

  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

/* =========================
   CHAT
========================= */

app.post("/api/chat", async (req, res) => {

  statistics.messages++;

  if (!GEMINI_API_KEY) {

    return res.status(500).json({
      error:
        "MORVIX no tiene configurada GEMINI_API_KEY en Render."
    });

  }

  try {

    const incomingMessages =
      Array.isArray(req.body.messages)
        ? req.body.messages
        : [];

    const contents = incomingMessages.map(message => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: String(message.content || "")
        }
      ]
    }));

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        systemInstruction: {
          parts: [
            {
              text:
                "Tu nombre es MORVIX AI. " +
                "Eres un asistente moderno, útil, claro y amigable. " +
                "Responde en español salvo que el usuario solicite otro idioma. " +
                "Utiliza Markdown cuando ayude a organizar la respuesta. " +
                "Para código utiliza bloques Markdown. " +
                "No inventes información."
            }
          ]
        },

        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }

      })

    });

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "Gemini:",
        JSON.stringify(data, null, 2)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Error de Gemini."
      });

    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "No pude generar una respuesta.";

    res.json({
      answer,
      model: TEXT_MODEL
    });

  } catch (error) {

    console.error("CHAT ERROR:", error);

    res.status(500).json({
      error:
        "MORVIX tuvo un error al comunicarse con Gemini."
    });

  }

});

/* =========================
   GENERACIÓN DE IMÁGENES
========================= */

app.post("/api/image", async (req, res) => {

  if (!GEMINI_API_KEY) {

    return res.status(500).json({
      error:
        "GEMINI_API_KEY no está configurada."
    });

  }

  const prompt =
    String(req.body.prompt || "").trim();

  if (!prompt) {

    return res.status(400).json({
      error: "Escribe una descripción para la imagen."
    });

  }

  try {

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        contents: [
          {
            role: "user",

            parts: [
              {
                text: prompt
              }
            ]
          }
        ],

        generationConfig: {

          responseModalities: [
            "TEXT",
            "IMAGE"
          ]

        }

      })

    });

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "IMAGE ERROR:",
        JSON.stringify(data, null, 2)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "El modelo de imágenes no está disponible para esta API key."
      });

    }

    const parts =
      data?.candidates?.[0]?.content?.parts || [];

    const imagePart =
      parts.find(
        part =>
          part.inlineData &&
          part.inlineData.mimeType?.startsWith("image/")
      );

    if (!imagePart) {

      const text =
        parts
          .map(part => part.text || "")
          .join("");

      return res.status(500).json({
        error:
          text ||
          "El modelo respondió, pero no devolvió una imagen."
      });

    }

    statistics.images++;

    res.json({

      image:
        `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,

      model: IMAGE_MODEL

    });

  } catch (error) {

    console.error("IMAGE ERROR:", error);

    res.status(500).json({
      error:
        "No se pudo generar la imagen."
    });

  }

});

/* =========================
   ARCHIVOS
========================= */

app.post(
  "/api/upload",
  upload.single("file"),
  async (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        error: "No se recibió ningún archivo."
      });

    }

    statistics.files++;

    res.json({

      success: true,

      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      },

      message:
        `Archivo "${req.file.originalname}" recibido correctamente.`

    });

  }
);

/* =========================
   BÚSQUEDA WEB
========================= */

app.get("/api/search", async (req, res) => {

  const query =
    String(req.query.q || "").trim();

  if (!query) {

    return res.status(400).json({
      error: "Escribe algo para buscar."
    });

  }

  /*
    MORVIX no hace scraping automático de Google.
    Esta ruta deja preparada la función.
  */

  res.json({

    query,

    message:
      "Búsqueda web preparada. Puedes conectar aquí un proveedor de búsqueda cuando quieras."

  });

});

/* =========================
   SPA FALLBACK
========================= */

app.use((req, res) => {

  if (req.method === "GET") {

    res.sendFile(
      path.join(__dirname, "public", "index.html")
    );

  } else {

    res.status(404).json({
      error: "Ruta no encontrada."
    });

  }

});

/* =========================
   SERVIDOR
========================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `MORVIX AI funcionando en el puerto ${PORT}`
  );

  console.log(
    `Modelo de texto: ${TEXT_MODEL}`
  );

  console.log(
    `Modelo de imágenes: ${IMAGE_MODEL}`
  );

});
