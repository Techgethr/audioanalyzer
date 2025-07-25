const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const {getInstructions} = require("../../promptManager")
require('dotenv').config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_ENDPOINT = process.env.MISTRAL_ENDPOINT;
const MISTRAL_MODEL_AUDIO = process.env.MISTRAL_MODEL_AUDIO || 'voxtral-mini-latest';
const MISTRAL_MODEL_TEXT = process.env.MISTRAL_MODEL_TEXT || 'mistral-small-2506';

/**
 * 📤 Sube el archivo de audio a Mistral
 */
async function uploadAudio(filePath) {
  const form = new FormData();
  form.append('purpose', 'audio');
  form.append('file', fs.createReadStream(filePath));

  try {
    const { data } = await axios.post(`${MISTRAL_ENDPOINT}/files`, form, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        ...form.getHeaders(),
      },
    });
    return data.id;
  } catch (error) {
    throw new Error(`Error al subir archivo a Mistral`);
  }
}

/**
 * 🔗 Obtiene la URL firmada del archivo subido
 */
async function getSignedUrl(fileId) {
  const url = `${MISTRAL_ENDPOINT}/files/${fileId}/url?expiry=24`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return data.url;
  } catch (error) {
    throw new Error(`Error al obtener URL del archivo firmado`);
  }
}

/**
 * 🧠 Envía el audio + checklist al modelo Voxtral
 */
async function requestAnalysis(signedUrl, checklist, language) {

    const instructions = getInstructions(language,checklist,null);
    const payload = {
        model: MISTRAL_MODEL_AUDIO,
        messages: [
        {
            role: 'user',
            content: [
            {
                type: 'input_audio',
                input_audio: {
                data: signedUrl,
                format: 'mp3',
                },
            },
            {
                type: 'text',
                text: instructions.prompt,
            },
            ],
        },
        ],
    };
  
  try {
    const { data } = await axios.post(`${MISTRAL_ENDPOINT}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return {transcription : null, results: data.choices[0].message.content};
  } catch (error) {
    throw new Error(`Error en la solicitud de análisis`);
  }
}


async function transcribeAudio(filePath) {

  const fileId = await uploadAudio(filePath);
  const signedUrl = await getSignedUrl(fileId);
  const form = new FormData();

  form.append('file_url', signedUrl);
  form.append('model', MISTRAL_MODEL_AUDIO);
  try {
    const { data } = await axios.post(`${MISTRAL_ENDPOINT}/audio/transcriptions`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return data.text;
  } catch (error) {
    throw new Error(`Error en la transcripción del audio`);
  }
}

async function analyzeWithTranscription(filePath, checklist, language) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Invalid file path provided for audio analysis.');
  }
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error('Checklist must be a non-empty array.');
  }

  const transcription = await transcribeAudio(filePath);
  const instructions = getInstructions(language,checklist,transcription);

  const payload = {
    model: MISTRAL_MODEL_TEXT,
    messages: [
      { role: 'system', content: instructions.systemMessage },
      { role: 'user', content: instructions.prompt }
    ],
  };
  try {
    const {data} = await axios.post(`${MISTRAL_ENDPOINT}/chat/completions`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return {transcription : transcription, results: data.choices[0].message.content };
  } catch (error) {
    throw new Error(`Error al subir archivo para análisis con transcripción`);
  }
}


/**
 * 🚀 Flujo completo de análisis de audio
 */
async function analyzeDirectFromAudio(filePath, checklist, language) {
  try {
    const fileId = await uploadAudio(filePath);
    const signedUrl = await getSignedUrl(fileId);
    const analysis = await requestAnalysis(signedUrl, checklist, language);
    return analysis;
  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
    return null;
  }
}

module.exports = {
  analyzeDirectFromAudio,
  analyzeWithTranscription
};
