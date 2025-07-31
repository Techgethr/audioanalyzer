const fs = require('fs');
const path = require('path');
const database = require('./services/database');

const PROCESSED_DIR = path.resolve(__dirname, '..', 'processed');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveResult(campaignName, file, transcription, results) {
  if(!process.env.DB_ENGINE){
    const dir = path.join(PROCESSED_DIR, campaignName);
    ensureDir(dir);
    
    const txtFileName = file.replace(/\.[^/.]+$/, '.txt');
    const txtFilePath = path.join(dir, txtFileName);
    const resultText = [
      `File: ${file}`,
      `Campaign: ${campaignName}`,
      '',
      'Transcription:',
      transcription,
      '',
      'Results:',
      JSON.stringify(results),
      ''
    ].join('\n');
    
    // Save to file
    fs.writeFileSync(txtFilePath, resultText, 'utf-8');
    console.log(`Result saved in file: ${txtFilePath}`);
  } else {
    // Save to database
  try {
    const resultData = {
        campaignName,
        fileName: file,
        transcription: transcription || null,
        complianceScore: results.complianceScore || 0,
        overallFeedback: results.overallFeedback || '',
        predominantEmotion: results.emotionalAnalysis.predominantEmotion || null,
        predominantEmotionJustification: results.emotionalAnalysis.justification || null,
        professionalTone: results.communicationTone.professionalTone,
        empatheticTone: results.communicationTone.empatheticTone,
        appropriateTone: results.communicationTone.appropriateTone,
        communicationToneJustification: results.communicationTone.justification || null,
        technicalQualityAdequate: results.technicalQuality.adequateQuality,
        technicalQualityJustification: results.technicalQuality.justification || null,
        doChecklistResults: results.doChecklistResults || {},
        dontChecklistResults: results.dontChecklistResults || {},
        strengths: results.strengths || [],
        improvementAreas: results.improvementAreas || [],
        processedAt: new Date()
      };
      
      await database.saveResult(resultData);
      console.log(`Result saved in database for: ${file}`);
    } catch (error) {
      console.error(`Error saving in database for ${file}:`, error.message);
      // Continue execution even if database save fails
    }
  }
}

function moveAudioToProcessed(campaignName, file, srcPath) {
  const dir = path.join(PROCESSED_DIR, campaignName);
  ensureDir(dir);
  const destPath = path.join(dir, file);
  fs.renameSync(srcPath, destPath);
  console.log(`Audio moved to processed/${campaignName}/${file}`);
}

function handleFailedAudio(campaignName, file, srcPath, error) {
  const failedDir = path.join(PROCESSED_DIR, campaignName, 'failed');
  ensureDir(failedDir);
  
  const logFileName = file.replace(/\.[^/.]+$/, '.log');
  const logFilePath = path.join(failedDir, logFileName);
  const errorText = `Failed to process ${file} for campaign ${campaignName}.\nError: ${error.stack || error.message}\nTimestamp: ${new Date().toISOString()}`;
  
  try {
    fs.writeFileSync(logFilePath, errorText, 'utf-8');
    console.log(`Log de error guardado en: ${logFilePath}`);
  } catch (writeErr) {
    console.error(`CRITICAL: Could not save error log for ${file}: ${writeErr.message}`);
  }
  
  const destPath = path.join(failedDir, file);
  try {
    if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.error(`Audio ${file} moved to failed directory.`);
    }
  } catch (moveErr) {
    console.error(`CRITICAL: Could not move failed audio ${file} to ${failedDir}: ${moveErr.message}`);
  }
}

module.exports = {
  saveResult,
  moveAudioToProcessed,
  handleFailedAudio
}; 