const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.resolve(__dirname, '..', 'processed');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveResult(campaignName, file, transcription, checklist, gptResult) {
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
  
  fs.writeFileSync(txtFilePath, resultText, 'utf-8');
}

function moveAudioToProcessed(campaignName, file, srcPath) {
  const dir = path.join(PROCESSED_DIR, campaignName);
  ensureDir(dir);
  const destPath = path.join(dir, file);
  fs.renameSync(srcPath, destPath);
  console.log(`Archivo movido a processed/${campaignName}/${file}`);
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
    console.error(`CRITICO: No se pudo guardar el log de error para ${file}: ${writeErr.message}`);
  }
  
  const destPath = path.join(failedDir, file);
  try {
    if (fs.existsSync(srcPath)) {
        fs.renameSync(srcPath, destPath);
        console.error(`Archivo ${file} movido a la carpeta de fallidos.`);
    }
  } catch (moveErr) {
    console.error(`CRITICO: No se pudo mover el archivo fallido ${file} a ${failedDir}: ${moveErr.message}`);
  }
}

module.exports = {
  saveResult,
  moveAudioToProcessed,
  handleFailedAudio
}; 