function getMimeType(extension) {
    const mimeTypes = {
      mp3: 'audio/mp3',
      mp4: 'video/mp4',
      mpeg: 'video/mpeg',
      mpga: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
      webm: 'audio/webm',
    };
    const ext = extension.replace(/^\./, '').toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
    getMimeType
}
