require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {

  try {

    const messages = req.body.messages;

    const response = await client.responses.create({

      model: process.env.OPENAI_MODEL || "gpt-5.6",

      instructions:
        "Eres ToolBox AI, un asistente inteligente, útil y amigable. Responde en español salvo que el usuario pida otro idioma.",

      input: messages

    });

    res.json({
      answer: response.output_text
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error al conectar con la IA."
    });

  }

});

app.listen(PORT, () => {

  console.log(
    `ToolBox AI funcionando en el puerto ${PORT}`
  );

});
