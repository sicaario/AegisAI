import { GoogleGenAI } from '@google/genai';

console.log("🚀 Testing Google Gen AI SDK");

async function run() {
    console.log("⏳ Initializing client");

    const client = new GoogleGenAI({
        vertexai: true,
        project: "aegisai-482123",
        location: "global"
    });

    console.log("⏳ Sending request to Gemini");

    const response = await client.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: "Say hello in one word"
    });

    console.log("✅ Response:", response.text);
}

run()
    .then(() => {
        console.log("🏁 SUCCESS!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ ERROR:", err.message);
        console.error(err.stack);
        process.exit(1);
    });
