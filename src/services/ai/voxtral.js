const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');
const { getInstructions } = require('../../promptManager');
require('dotenv').config();

const CONFIG = {
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  MISTRAL_ENDPOINT: process.env.MISTRAL_ENDPOINT,
  MISTRAL_MODEL_AUDIO: process.env.MISTRAL_MODEL_AUDIO || 'voxtral-mini-latest',
  MISTRAL_MODEL_TEXT: process.env.MISTRAL_MODEL_TEXT || 'mistral-small-2506',
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB limit
  SUPPORTED_FORMATS: ['mp3'],
  SIGNED_URL_EXPIRY: 24 // hours
};

/**
 * Uploads audio file to Mistral
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - File ID from Mistral
 */
async function uploadAudio(filePath) {
  try {
    // Validate file exists and is accessible
    await fs.access(filePath);
    
    const stats = await fs.stat(filePath);
    if (stats.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size of ${CONFIG.MAX_FILE_SIZE} bytes`);
    }

    const fileExtension = filePath.split('.').pop().toLowerCase();
    if (!CONFIG.SUPPORTED_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    }

    const form = new FormData();
    form.append('purpose', 'audio');
    form.append('file', require('fs').createReadStream(filePath));

    const { data } = await axios.post(`${CONFIG.MISTRAL_ENDPOINT}/files`, form, {
      headers: {
        Authorization: `Bearer ${CONFIG.MISTRAL_API_KEY}`,
        ...form.getHeaders(),
      },
    });

    if (!data.id) {
      throw new Error('No file ID returned from Mistral');
    }

    return data.id;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Gets signed URL for uploaded file
 * @param {string} fileId - Mistral file ID
 * @returns {Promise<string>} - Signed URL for file access
 */
async function getSignedUrl(fileId) {
  const url = `${CONFIG.MISTRAL_ENDPOINT}/files/${fileId}/url?expiry=${CONFIG.SIGNED_URL_EXPIRY}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${CONFIG.MISTRAL_API_KEY}`,
      },
    });

    if (!data.url) {
      throw new Error('No signed URL returned from Mistral');
    }

    return data.url;
  } catch (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }
}

/**
 * Sends audio + checklist to Mistral model for analysis
 * @param {string} signedUrl - Signed URL for audio file
 * @param {string[]} doChecklist - Array of quality criteria
 * @param {string[]} dontChecklist - Array of quality criteria
 * @param {string} language - Language for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function requestAnalysis(signedUrl, doChecklist, dontChecklist, language) {
  const instructions = getInstructions(language, doChecklist, dontChecklist, null);
  
  const payload = {
    model: CONFIG.MISTRAL_MODEL_AUDIO,
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
    const { data } = await axios.post(`${CONFIG.MISTRAL_ENDPOINT}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${CONFIG.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Empty response from Mistral');
    }

    let results = data.choices[0].message.content;
    results = results.replace('```json', '');
    results = results.replace('```', '');

    let parsedResults;
    try {
      parsedResults = JSON.parse(results);
    } catch (parseError) {
      console.warn('Failed to parse Mistral response as JSON, returning raw text:', parseError.message);
      parsedResults = { rawResponse: results };
    }

    return {
      transcription: null,
      results: parsedResults,
      metadata: {
        model: CONFIG.MISTRAL_MODEL_AUDIO,
        timestamp: new Date().toISOString(),
        checklistItems: doChecklist.length,
        dontChecklistItems: dontChecklist.length
      }
    };
  } catch (error) {
    throw new Error(`Analysis request failed: ${error.message}`);
  }
}


/**
 * Transcribes audio file using Mistral
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath) {
  try {
    const fileId = await uploadAudio(filePath);
    const signedUrl = await getSignedUrl(fileId);
    const form = new FormData();

    form.append('file_url', signedUrl);
    form.append('model', CONFIG.MISTRAL_MODEL_AUDIO);

    const { data } = await axios.post(`${CONFIG.MISTRAL_ENDPOINT}/audio/transcriptions`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${CONFIG.MISTRAL_API_KEY}`,
      },
    });

    if (!data.text) {
      throw new Error('No transcription text returned from Mistral');
    }

    return data.text.trim();
  } catch (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Analyzes audio with transcription using Mistral
 * @param {string} filePath - Path to the audio file
 * @param {string[]} checklist - Array of quality criteria to check
 * @param {string} language - Language for analysis
 * @returns {Promise<Object>} - Analysis results including transcription and analysis
 */
async function analyzeWithTranscription(filePath, doChecklist, dontChecklist, language) {
  // Input validation
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path: must be a non-empty string');
  }

  if (!Array.isArray(doChecklist) || doChecklist.length === 0) {
    throw new Error('Checklist must be a non-empty array');
  }

  if (!doChecklist.every(item => typeof item === 'string' && item.trim())) {
    throw new Error('All checklist items must be non-empty strings');
  }

  try {
    const transcription = await transcribeAudio(filePath);
    const instructions = getInstructions(language, doChecklist, dontChecklist, transcription);

    const payload = {
      model: CONFIG.MISTRAL_MODEL_TEXT,
      messages: [
        { role: 'system', content: instructions.systemMessage },
        { role: 'user', content: instructions.prompt }
      ],
    };

    const { data } = await axios.post(`${CONFIG.MISTRAL_ENDPOINT}/chat/completions`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.MISTRAL_API_KEY}`,
      },
    });

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Empty response from Mistral');
    }

    let results = data.choices[0].message.content;
    results = results.replace('```json', '');
    results = results.replace('```', '');
    
    let parsedResults;
    try {
      parsedResults = JSON.parse(results);
    } catch (parseError) {
      console.warn('Failed to parse Mistral response as JSON, returning raw text:', parseError.message);
      parsedResults = { rawResponse: results };
    }

    return {
      transcription,
      results: parsedResults,
      metadata: {
        model: CONFIG.MISTRAL_MODEL_TEXT,
        timestamp: new Date().toISOString(),
        checklistItems: doChecklist.length,
        dontChecklistItems: dontChecklist.length
      }
    };
  } catch (error) {
    throw new Error(`Analysis with transcription failed: ${error.message}`);
  }
}


/**
 * Complete audio analysis flow with Mistral
 * @param {string} filePath - Path to the audio file
 * @param {string[]} doChecklist - Array of quality criteria to check
 * @param {string[]} dontChecklist - Array of quality criteria to check
 * @param {string} language - Language for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeDirectFromAudio(filePath, doChecklist, dontChecklist, language) {
  try {
    const fileId = await uploadAudio(filePath);
    const signedUrl = await getSignedUrl(fileId);
    const analysis = await requestAnalysis(signedUrl, doChecklist, dontChecklist, language);
    return analysis;
  } catch (error) {
    console.error('❌ Error in analysis flow:', error.message);
    return null;
  }
}

module.exports = {
  transcribeAudio,
  analyzeWithTranscription,
  analyzeDirectFromAudio
};
