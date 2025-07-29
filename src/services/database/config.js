/**
 * Database configuration management
 */

const config = {
  // Default to Supabase as requested by user
  engine: process.env.DB_ENGINE || 'supabase',
  
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    tableName: process.env.SUPABASE_TABLE_NAME || 'audio_analysis_results'
  }
};

/**
 * Get configuration for the current database engine
 */
function getConfig() {
  return {
    engine: config.engine,
    ...config[config.engine]
  };
}

/**
 * Validate configuration for the current engine
 */
function validateConfig() {
  const currentConfig = getConfig();
  
  switch (currentConfig.engine) {
    case 'supabase':
      if (!currentConfig.url || !currentConfig.key) {
        throw new Error('Supabase configuration incomplete. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      }
      break;
    default:
      throw new Error(`Unsupported database engine: ${currentConfig.engine}`);
  }
}

module.exports = {
  getConfig,
  validateConfig
};
