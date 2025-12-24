import { VertexAI } from '@google-cloud/vertexai';

console.log("🚀 testVertex.js started");

async function run() {
    console.log("⏳ Initializing Vertex AI");

    const vertexAI = new VertexAI({
        project: "aegisai-482123",
        location: "global",  // ✅ CHANGED TO GLOBAL
    });

    const model = vertexAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    console.log("⏳ Sending request to Gemini");

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: "Say hello in one word." }],
            },
        ],
    });

    console.log(
        "✅ Gemini response:",
        result.response.candidates[0].content.parts[0].text
    );
}

run()
    .then(() => {
        console.log("🏁 Test finished successfully!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ ERROR:", err.message);
        console.error(err);
        process.exit(1);
    });
