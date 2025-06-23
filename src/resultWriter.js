const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PROCESSED_DIR = path.join(ROOT_DIR, 'processed');

function ensureProcessedDir(campaignName) {
  const dir = path.join(PROCESSED_DIR, campaignName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function saveResult(campaignName, file, transcription, checklist, gptResult) {
  const dir = ensureProcessedDir(campaignName);
  const txtFileName = file.replace(/\.[^/.]+$/, '.txt');
  const txtFilePath = path.join(dir, txtFileName);
  const resultText = [
    `Archivo: ${file}`,
    `Campaña: ${campaignName}`,
    '',
    'Transcripción:',
    transcription,
    '',
    'Checklist:',
    ...checklist.map((c, i) => `${i+1}. ${c}`),
    '',
    'Resultado del análisis GPT:',
    gptResult,
    ''
  ].join('\n');
  try {
    fs.writeFileSync(txtFilePath, resultText, 'utf-8');
  } catch (err) {
    console.error(`No se pudo guardar el resultado en ${txtFileName}: ${err.message}`);
  }
}

function moveAudioToProcessed(campaignName, file, srcPath) {
  const dir = ensureProcessedDir(campaignName);
  const destPath = path.join(dir, file);
  try {
    fs.renameSync(srcPath, destPath);
    console.log(`Archivo movido a processed/${campaignName}/${file}`);
  } catch (err) {
    console.error(`No se pudo mover el archivo: ${err.message}`);
  }
}

module.exports = {
  saveResult,
  moveAudioToProcessed
}; 