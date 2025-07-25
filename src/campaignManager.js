const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CAMPAIGNS_DIR = path.join(ROOT_DIR, 'campaigns');

function getCampaigns() {
  if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
  return fs.readdirSync(CAMPAIGNS_DIR).filter(f => fs.statSync(path.join(CAMPAIGNS_DIR, f)).isDirectory());
}

function getChecklist(campaignName) {
  const checklistPath = path.join(CAMPAIGNS_DIR, campaignName, 'checklist.txt');
  if (!fs.existsSync(checklistPath)) {
    throw new Error(`No checklist.txt found for campaign ${campaignName}`);
  }
  const lines = fs.readFileSync(checklistPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const language = lines[0]; // Primera línea como idioma
  const checklist = lines.slice(1); // Resto como checklist

  return { language, checklist };
}

function getAudios(campaignName) {
  const audiosDir = path.join(CAMPAIGNS_DIR, campaignName, 'audios');
  if (!fs.existsSync(audiosDir)) return [];
  return fs.readdirSync(audiosDir).filter(f => f.match(/\.(mp3|wav|m4a|mp4)$/i));
}

function getAudioPath(campaignName, file) {
  return path.join(CAMPAIGNS_DIR, campaignName, 'audios', file);
}

module.exports = {
  getCampaigns,
  getChecklist,
  getAudios,
  getAudioPath
}; 