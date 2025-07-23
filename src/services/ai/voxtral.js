const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
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
    const { data } = await axios.post('https://api.mistral.ai/v1/files', form, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        ...form.getHeaders(),
      },
    });
    return data.id;
  } catch (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
}

/**
 * 🔗 Obtiene la URL firmada del archivo subido
 */
async function getSignedUrl(fileId) {
  const url = `https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return data.url;
  } catch (error) {
    throw new Error(`Error al obtener URL del archivo: ${error.message}`);
  }
}

/**
 * 🧠 Envía el audio + checklist al modelo Voxtral
 */
async function requestAnalysis(signedUrl, checklist) {
    const prompt = `Dado este audio de una llamada, responde SÍ o NO para cada uno de los siguientes puntos que deberían estar presentes en el audio, si están, es SÍ, de lo contrario es NO, y justifica brevemente tu respuesta:\n\nChecklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\nResponde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...`;
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
                text: prompt,
            },
            ],
        },
        ],
    };
  
  try {
    const { data } = await axios.post('https://api.mistral.ai/v1/chat/completions', payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return {transcription : null, results: data.choices[0].message.content};
  } catch (error) {
    throw new Error(`Error en la solicitud de análisis: ${error.message}`);
  }
}


async function transcribeAudio(filePath) {

  const fileId = await uploadAudio(filePath);
  const signedUrl = await getSignedUrl(fileId);
  const form = new FormData();

  form.append('file_url', signedUrl);
  form.append('model', MISTRAL_MODEL_AUDIO);
  try {
    const { data } = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return data.text;
  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
    return null;
  }
}

async function analyzeWithTranscription(filePath, checklist) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Invalid file path provided for audio analysis.');
  }
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error('Checklist must be a non-empty array.');
  }

  const transcription = await transcribeAudio(filePath);

  const prompt = `Dada la siguiente transcripción de una llamada, responde SÍ o NO para cada uno de los siguientes puntos, y justifica brevemente tu respuesta:\n\nChecklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\nTranscripción:\n${transcription}\n\nResponde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...`;

  const payload = {
    model: MISTRAL_MODEL_TEXT,
    messages: [
      { role: 'system', content: 'Eres un asistente que evalúa llamadas de call center.' },
      { role: 'user', content: prompt }
    ],
  };
  try {
    const {data} = await axios.post('https://api.mistral.ai/v1/chat/completions', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
    });
    return {transcription : transcription, results: data.choices[0].message.content };
  } catch (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
}


/**
 * 🚀 Flujo completo de análisis de audio
 */
async function analyzeDirectFromAudio(filePath, checklist) {
  try {
    const fileId = await uploadAudio(filePath);
    const signedUrl = await getSignedUrl(fileId);
    const analysis = await requestAnalysis(signedUrl, checklist);
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
