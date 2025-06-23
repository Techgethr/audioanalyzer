require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Configuración
const CAMPAIGNS_DIR = path.join(__dirname, 'campaigns');
const PROCESSED_DIR = path.join(__dirname, 'processed');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Leer el script
function loadScript(scriptPath) {
  if (!fs.existsSync(scriptPath)) {
    console.error(`No se encontró el archivo de script: ${scriptPath}`);
    process.exit(1);
  }
  return fs.readFileSync(scriptPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
}

// Transcribir audio con OpenAI Whisper
async function transcribeAudio(filePath) {
  try {
    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: 'text',
      language: 'es',
    });
    return resp;
  } catch (err) {
    console.error(`Error transcribiendo ${filePath}: ${err.message}`);
    return '';
  }
}

// Verificar cumplimiento del script
function checkScript(transcription, scriptLines) {
  const results = scriptLines.map(line => ({
    line,
    found: transcription.toLowerCase().includes(line.toLowerCase())
  }));
  return results;
}

// Procesar audios de una campaña
async function processCampaign(campaignName) {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignName);
  const scriptPath = path.join(campaignPath, 'script.txt');
  const audiosDir = path.join(campaignPath, 'audios');
  const processedCampaignDir = path.join(PROCESSED_DIR, campaignName);

  if (!fs.existsSync(audiosDir)) {
    console.error(`No se encontró la carpeta de audios para la campaña ${campaignName}`);
    return;
  }
  if (!fs.existsSync(processedCampaignDir)) {
    fs.mkdirSync(processedCampaignDir, { recursive: true });
  }
  const files = fs.readdirSync(audiosDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp4'));
  if (files.length === 0) {
    console.log(`No hay archivos de audio en la campaña ${campaignName}`);
    return;
  }
  const scriptLines = loadScript(scriptPath);
  for (const file of files) {
    const filePath = path.join(audiosDir, file);
    console.log(`\n[${campaignName}] Analizando: ${file}`);
    const transcription = await transcribeAudio(filePath);
    if (!transcription) continue;
    console.log('Transcripción:', transcription.slice(0, 200) + (transcription.length > 200 ? '...' : ''));
    const results = checkScript(transcription, scriptLines);
    results.forEach(r => {
      if (r.found) {
        console.log(`✔ Frase encontrada: "${r.line}"`);
      } else {
        console.log(`✘ Frase NO encontrada: "${r.line}"`);
      }
    });
    // Guardar resultados en archivo de texto
    const resultText = [
      `Archivo: ${file}`,
      `Campaña: ${campaignName}`,
      '',
      'Transcripción:',
      transcription,
      '',
      'Resultados:',
      ...results.map(r => (r.found ? `✔ Frase encontrada: "${r.line}"` : `✘ Frase NO encontrada: "${r.line}"`)),
      ''
    ].join('\n');
    const txtFileName = file.replace(/\.[^/.]+$/, '.txt');
    const txtFilePath = path.join(processedCampaignDir, txtFileName);
    try {
      fs.writeFileSync(txtFilePath, resultText, 'utf-8');
    } catch (err) {
      console.error(`No se pudo guardar el resultado en ${txtFileName}: ${err.message}`);
    }
    // Mover archivo procesado
    const destPath = path.join(processedCampaignDir, file);
    try {
      fs.renameSync(filePath, destPath);
      console.log(`Archivo movido a processed/${campaignName}/${file}`);
    } catch (err) {
      console.error(`No se pudo mover el archivo: ${err.message}`);
    }
  }
}

// Procesar todas las campañas o una específica
async function main() {
  if (!fs.existsSync(CAMPAIGNS_DIR)) {
    console.error('No se encontró la carpeta campaigns/');
    process.exit(1);
  }
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR);
  }
  const campaignArg = process.argv[2];
  if (campaignArg) {
    // Procesar solo la campaña indicada
    await processCampaign(campaignArg);
  } else {
    // Procesar todas las campañas
    const campaigns = fs.readdirSync(CAMPAIGNS_DIR).filter(f => fs.statSync(path.join(CAMPAIGNS_DIR, f)).isDirectory());
    for (const campaignName of campaigns) {
      await processCampaign(campaignName);
    }
  }
}

main(); 