require('dotenv').config();
const fs = require('fs').promises;
const { OpenAI } = require('openai');
const { getInstructions } = require('../../promptManager');

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY, 
  baseURL: process.env.OPENAI_BASE_URL 
});

const whisper = new OpenAI({ 
  apiKey: process.env.WHISPER_API_KEY, 
  baseURL: process.env.WHISPER_BASE_URL 
});

const CONFIG = {
  AUDIO_MODEL: process.env.WHISPER_MODEL || 'whisper-1',
  TEXT_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB limit for Whisper
  SUPPORTED_FORMATS: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
};

/**
 * Transcribes audio file using OpenAI Whisper
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeAudio(filePath) {
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

    const response = await whisper.audio.transcriptions.create({
      file: require('fs').createReadStream(filePath),
      model: CONFIG.AUDIO_MODEL,
      response_format: 'text'
    });

    if (!response || !response.trim()) {
      throw new Error('Transcription returned an empty result');
    }

    return response.trim();
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Analyzes audio content using GPT based on provided checklist
 * @param {string} filePath - Path to the audio file
 * @param {string[]} doChecklist - Array of quality criteria to check
 * @param {string[]} dontChecklist - Array of quality criteria to check
 * @param {string} [language='es'] - Language for analysis
 * @returns {Promise<Object>} - Analysis results including transcription and GPT analysis
 */
async function analyzeWithGPT(filePath, doChecklist, dontChecklist, language = 'es') {
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
    // Transcribe the audio
    const transcription = await transcribeAudio(filePath);
    
    // Get instructions for GPT analysis
    const instructions = getInstructions(language, doChecklist, dontChecklist, transcription);

    // Perform GPT analysis
    const completion = await openai.chat.completions.create({
      model: CONFIG.TEXT_MODEL,
      messages: [
        { role: 'system', content: instructions.systemMessage },
        { role: 'user', content: instructions.prompt }
      ],
      temperature: 0.2
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Received empty response from GPT');
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
        model: CONFIG.TEXT_MODEL,
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
  analyzeWithGPT // Updated function name for consistency
};