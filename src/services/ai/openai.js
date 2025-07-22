require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AUDIO_MODEL = process.env.OPENAI_MODEL_AUDIO || 'whisper-1';
const TEXT_MODEL = process.env.OPENAI_MODEL_TEXT || 'gpt-3.5-turbo';

async function transcribeAudio(filePath) {
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: AUDIO_MODEL,
    response_format: 'text',
    language: 'es',
  });
  if (!resp) {
    throw new Error('Transcription returned an empty result.');
  }
  return resp;
}

async function analyzeWithGPT(transcription, checklist) {
  const prompt = `Dada la siguiente transcripción de una llamada, responde SÍ o NO para cada uno de los siguientes puntos, y justifica brevemente tu respuesta:\n\nChecklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\nTranscripción:\n${transcription}\n\nResponde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...`;
  
  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: 'Eres un asistente que evalúa llamadas de call center.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  });
  
  if (!completion.choices[0].message.content) {
    throw new Error('Received empty response from GPT.');
  }
  
  return completion.choices[0].message.content.trim();
}

module.exports = {
  transcribeAudio,
  analyzeWithGPT
}; 