const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.use(express.static(path.join(__dirname, "public")));

let statistics = {
    requests: 0,
    images: 0,
    files: 0,
    users: new Set(),
    started: Date.now()
};

const conversations = new Map();

function createUserId(req) {
    const existing = req.headers["x-morvix-user"];

    if (existing) {
        return existing;
    }

    return crypto
        .createHash("sha256")
        .update(
            (req.ip || "unknown") +
            "-" +
            (req.headers["user-agent"] || "")
        )
        .digest("hex")
        .slice(0, 20);
}

function getModel() {
    if (!GEMINI_API_KEY) {
        throw new Error(
            "Falta configurar GEMINI_API_KEY en Render."
        );
    }

    const genAI = new GoogleGenerativeAI(
        GEMINI_API_KEY
    );

    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite"
    });
}


/*
====================================================
                    HEALTH
====================================================
*/

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        name: "MORVIX AI",
        status: "online"
    });
});


/*
====================================================
                    CHAT
====================================================
*/

app.post("/api/chat", async (req, res) => {

    const userId = createUserId(req);

    statistics.requests++;
    statistics.users.add(userId);

    try {

        const model = getModel();

        const incomingMessages =
            Array.isArray(req.body.messages)
                ? req.body.messages
                : [];

        const cleanMessages =
            incomingMessages
                .slice(-30)
                .filter(
                    m =>
                        m &&
                        typeof m.content === "string"
                );

        if (cleanMessages.length === 0) {
            return res.status(400).json({
                error: "No se recibió ningún mensaje."
            });
        }

        const history = cleanMessages
            .slice(0, -1)
            .map(message => ({
                role:
                    message.role === "assistant"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text: message.content
                    }
                ]
            }));

        const lastMessage =
            cleanMessages[cleanMessages.length - 1];

        const chat = model.startChat({
            history,
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 4096
            }
        });

        const result =
            await chat.sendMessage(
                lastMessage.content
            );

        const response =
            result.response;

        const answer =
            response.text();

        conversations.set(
            userId,
            cleanMessages.concat([
                {
                    role: "assistant",
                    content: answer
                }
            ]).slice(-50)
        );

        res.json({
            answer,
            model: "gemini-2.5-flash-lite"
        });

    } catch (error) {

        console.error(
            "ERROR GEMINI:",
            error
        );

        let message =
            "MORVIX no pudo conectarse con la IA.";

        const errorText =
            String(
                error?.message ||
                error
            );

        if (
            errorText.includes("API_KEY") ||
            errorText.includes("api key")
        ) {
            message =
                "La API de Gemini no está configurada correctamente en Render.";
        }

        if (
            errorText.includes("429") ||
            errorText.includes("quota") ||
            errorText.includes("RESOURCE_EXHAUSTED")
        ) {
            message =
                "Se alcanzó temporalmente el límite gratuito de Gemini. Inténtalo nuevamente más tarde.";
        }

        if (
            errorText.includes("404") ||
            errorText.includes("NOT_FOUND")
        ) {
            message =
                "El modelo de Gemini configurado no está disponible para esta cuenta.";
        }

        res.status(500).json({
            error: message,
            details: errorText
        });
    }
});


/*
====================================================
                GENERACIÓN DE IMAGEN
====================================================

La ruta queda preparada para conectar
un proveedor de imágenes.

No se inventará una imagen si el proveedor
no está disponible.
*/

app.post(
    "/api/generate-image",
    async (req, res) => {

        statistics.images++;

        const prompt =
            typeof req.body.prompt === "string"
                ? req.body.prompt.trim()
                : "";

        if (!prompt) {
            return res.status(400).json({
                error:
                    "Escribe una descripción para crear la imagen."
            });
        }

        /*
        Puedes conectar aquí un proveedor de
        generación de imágenes con API.

        Por seguridad, actualmente devolvemos
        un mensaje claro en lugar de fingir
        que la imagen fue creada.
        */

        return res.status(501).json({
            error:
                "La generación de imágenes necesita un proveedor de imágenes configurado."
        });
    }
);


/*
====================================================
                    ARCHIVOS
====================================================
*/

app.post(
    "/api/upload",
    upload.single("file"),
    async (req, res) => {

        statistics.files++;

        try {

            if (!req.file) {
                return res.status(400).json({
                    error:
                        "No se recibió ningún archivo."
                });
            }

            const originalName =
                req.file.originalname;

            const mime =
                req.file.mimetype;

            const fileSize =
                req.file.size;

            let text = null;

            const textTypes = [
                "text/plain",
                "text/markdown",
                "application/json",
                "text/csv",
                "text/html",
                "text/css",
                "application/javascript"
            ];

            if (
                textTypes.includes(mime)
            ) {

                text =
                    fs.readFileSync(
                        req.file.path,
                        "utf8"
                    );
            }

            fs.unlink(
                req.file.path,
                () => {}
            );

            res.json({
                success: true,
                file: {
                    name: originalName,
                    type: mime,
                    size: fileSize
                },
                text
            });

        } catch (error) {

            console.error(
                "ERROR ARCHIVO:",
                error
            );

            res.status(500).json({
                error:
                    "No se pudo procesar el archivo."
            });
        }
    }
);


/*
====================================================
                    ESTADÍSTICAS
====================================================
*/

app.get(
    "/api/stats",
    (req, res) => {

        const uptime =
            Date.now() -
            statistics.started;

        res.json({
            requests:
                statistics.requests,

            images:
                statistics.images,

            files:
                statistics.files,

            users:
                statistics.users.size,

            uptime
        });
    }
);


/*
====================================================
                INFORMACIÓN DE MORVIX
====================================================
*/

app.get(
    "/api/info",
    (req, res) => {

        res.json({
            name: "MORVIX AI",
            version: "3.0.0",
            model: "gemini-2.5-flash-lite",
            features: [
                "Chat IA",
                "Markdown",
                "Código",
                "Historial",
                "Archivos",
                "Imágenes",
                "Búsqueda web preparada",
                "PWA",
                "Modo oscuro",
                "Estadísticas"
            ]
        });
    }
);


/*
====================================================
                    FRONTEND
====================================================
*/

app.use(
    (req, res, next) => {

        if (
            req.method === "GET" &&
            !req.path.startsWith("/api/")
        ) {
            return res.sendFile(
                path.join(
                    __dirname,
                    "public",
                    "index.html"
                )
            );
        }

        next();
    }
);


/*
====================================================
                    SERVIDOR
====================================================
*/

app.listen(
    PORT,
    () => {

        console.log(
            `MORVIX AI funcionando en el puerto ${PORT}`
        );

        console.log(
            GEMINI_API_KEY
                ? "Gemini API configurada."
                : "ADVERTENCIA: GEMINI_API_KEY no está configurada."
        );
    }
);
