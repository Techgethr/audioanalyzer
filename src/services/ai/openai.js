require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');
const {getInstructions} = require("../../promptManager")

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

async function analyzewithGPT(filePath, checklist, language) {

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Invalid file path provided for audio analysis.');
  }
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error('Checklist must be a non-empty array.');
  }
  const transcription = await transcribeAudio(filePath);

  const instructions = getInstructions(language,checklist,transcription);

  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: instructions.systemMessage },
      { role: 'user', content: instructions.prompt }
    ],
    temperature: 0.2
  });
  
  if (!completion.choices[0].message.content) {
    throw new Error('Received empty response from GPT.');
  }
  
  return {transcription : transcription, results: completion.choices[0].message.content.trim()};
}

module.exports = {
  analyzewithGPT
}; 