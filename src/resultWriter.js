const fs = require('fs');
const path = require('path');
const database = require('./services/database');

const PROCESSED_DIR = path.resolve(__dirname, '..', 'processed');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveResult(campaignName, file, transcription, gptResult) {
  let jsonResult;
  gptResult = gptResult.replace("```json", "");
  gptResult = gptResult.replace("```", "");
  gptResult = gptResult.trim();
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
      gptResult,
      ''
    ].join('\n');
    
    // Save to file
    fs.writeFileSync(txtFilePath, resultText, 'utf-8');
    console.log(`Result saved in file: ${txtFilePath}`);
  } else {
    // Save to database
  try {
    jsonResult = JSON.parse(gptResult);
    const resultData = {
        campaignName,
        fileName: file,
        transcription: transcription || null,
        complianceScore: jsonResult.complianceScore || 0,
        overallFeedback: jsonResult.overallFeedback || '',
        predominantEmotion: jsonResult.emotionalAnalysis.predominantEmotion || null,
        predominantEmotionJustification: jsonResult.emotionalAnalysis.justification || null,
        professionalTone: jsonResult.communicationTone.professionalTone,
        empatheticTone: jsonResult.communicationTone.empatheticTone,
        appropriateTone: jsonResult.communicationTone.appropriateTone,
        communicationToneJustification: jsonResult.communicationTone.justification || null,
        technicalQualityAdequate: jsonResult.technicalQuality.adequateQuality,
        technicalQualityJustification: jsonResult.technicalQuality.justification || null,
        checklistResults: jsonResult.checklistResults || {},
        strengths: jsonResult.strengths || [],
        improvementAreas: jsonResult.improvementAreas || [],
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