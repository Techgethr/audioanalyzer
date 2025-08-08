const { InferenceClient } = require("@huggingface/inference");
const fs = require('fs');

const { getInstructions, ANONYMIZER_PROMPT } = require('../../promptManager');
require('dotenv').config();

const CONFIG = {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    HUGGINGFACE_PROVIDER_TEXT: process.env.HUGGINGFACE_PROVIDER_TEXT,
    HUGGINGFACE_PROVIDER_AUDIO: process.env.HUGGINGFACE_PROVIDER_AUDIO,
    HUGGINGFACE_MODEL_AUDIO: process.env.HUGGINGFACE_AUDIO_MODEL || 'voxtral-mini-latest',
    HUGGINGFACE_MODEL_TEXT: process.env.HUGGINGFACE_TEXT_MODEL || 'mistral-mini-latest',
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB limit
    SUPPORTED_FORMATS: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
  };

const inferenceClient = new InferenceClient();

/**
 * Transcribes audio file using Huggingface models
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath) {
  try {
    // Validate file exists and is accessible
    fs.existsSync(filePath);

    const stats = fs.statSync(filePath);
    if (stats.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size of ${CONFIG.MAX_FILE_SIZE} bytes`);
    }

    const fileExtension = filePath.split('.').pop().toLowerCase();
    if (!CONFIG.SUPPORTED_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    }

    let blob = new Blob([fs.readFileSync(filePath)], { type: 'audio/mpeg' });

    const response = await inferenceClient.automaticSpeechRecognition({
      accessToken: CONFIG.HUGGINGFACE_API_KEY,
      provider: CONFIG.HUGGINGFACE_PROVIDER_AUDIO || undefined,
      inputs: blob,
      model: CONFIG.HUGGINGFACE_MODEL_AUDIO,
    });

    if (!response || !response.text.trim()) {
      throw new Error('Transcription returned an empty result');
    }

    return response.text.trim();
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    throw error;
  }
}

async function anonymizeText(text) {
    if(!text || typeof text !== 'string') {
      throw new Error('Invalid text: must be a non-empty string');
    }
  
    try {
      const response = await inferenceClient.chatCompletion({
        accessToken: CONFIG.HUGGINGFACE_API_KEY,
        model: CONFIG.HUGGINGFACE_MODEL_TEXT,
        provider: CONFIG.HUGGINGFACE_PROVIDER_TEXT || undefined,
        messages: [
          { role: 'system', content: ANONYMIZER_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.2
      });
  
      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Received empty response from the anonymizer');
      }
  
      return response.choices[0].message.content.trim();
    } catch (error) {
      throw new Error(`Text anonymization failed: ${error.message}`);
    }
  }

/**
 * Analyzes audio content using Huggingface models based on provided checklist
 * @param {string} transcription - Transcribed text
 * @param {string[]} doChecklist - Array of quality criteria to check
 * @param {string[]} dontChecklist - Array of quality criteria to check
 * @param {string} [language='es'] - Language for analysis
 * @returns {Promise<Object>} - Analysis results including transcription and Huggingface analysis
 */
async function analyzeTranscription(transcription, doChecklist, dontChecklist, language = 'es') {
  // Input validation
  if (!transcription || typeof transcription !== 'string') {
    throw new Error('Invalid transcription: must be a non-empty string');
  }

  if (!Array.isArray(doChecklist) || doChecklist.length === 0) {
    throw new Error('Checklist must be a non-empty array');
  }

  if (!doChecklist.every(item => typeof item === 'string' && item.trim())) {
    throw new Error('All checklist items must be non-empty strings');
  }

  try {
    
    // Get instructions for GPT analysis
    const instructions = getInstructions(language, doChecklist, dontChecklist, transcription);

    // Perform GPT analysis
    const completion = await inferenceClient.chatCompletion({
      accessToken: CONFIG.HUGGINGFACE_API_KEY,
      model: CONFIG.HUGGINGFACE_MODEL_TEXT,
      provider: CONFIG.HUGGINGFACE_PROVIDER_TEXT || undefined,
      messages: [
        { role: 'system', content: instructions.systemMessage },
        { role: 'user', content: instructions.prompt }
      ],
      temperature: 0.2
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Received empty response from the analyzer');
    }

    const results = completion.choices[0].message.content.trim();
    
    // Attempt to parse JSON response
    let parsedResults;
    try {
      parsedResults = JSON.parse(results);
    } catch (parseError) {
      console.warn('Failed to parse GPT response as JSON, returning raw text:', parseError.message);
      parsedResults = { rawResponse: results };
    }

    return {
      transcription,
      results: parsedResults,
      metadata: {
        model: CONFIG.HUGGINGFACE_MODEL_TEXT,
        timestamp: new Date().toISOString(),
        checklistItems: doChecklist.length,
        dontChecklistItems: dontChecklist.length
      }
    };
  } catch (error) {
    // Wrap errors with context
    throw new Error(`Audio analysis failed: ${error.message}`);
  }
}

module.exports = {
    transcribeAudio,
    anonymizeText,
    analyzeTranscription
};
