require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  try {
    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: process.env.OPENAI_MODEL_AUDIO,
      response_format: 'text',
      language: 'es',
    });
    return resp;
  } catch (err) {
    console.error(`Error transcribing ${filePath}: ${err.message}`);
    return '';
  }
}

async function analyzeWithGPT(transcription, checklist) {
  const prompt = `Dada la siguiente transcripción de una llamada, responde SÍ o NO para cada uno de los siguientes puntos, y justifica brevemente tu respuesta:\n\nChecklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\nTranscripción:\n${transcription}\n\nResponde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...`;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_TEXT,
      messages: [
        { role: 'system', content: 'Eres un asistente que evalúa llamadas de call center.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error(`Error analyzing with GPT: ${err.message}`);
    return 'Error analyzing with GPT.';
  }
}

module.exports = {
  transcribeAudio,
  analyzeWithGPT
}; 