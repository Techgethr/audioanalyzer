/**
 * Database abstraction layer for audio analysis results
 * Supports multiple database engines through a unified interface
 */

const config = require('./config');

class DatabaseManager {
  constructor() {
    this.provider = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database connection based on configuration
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { engine } = config.getConfig();
    
    switch (engine) {
      case 'supabase':
        const SupabaseProvider = require('./providers/supabase');
        this.provider = new SupabaseProvider();
        break;
      default:
        throw new Error(`Unsupported database engine: ${engine}`);
    }

    await this.provider.connect();
    this.isInitialized = true;
    console.log(`Database initialized with ${engine} provider`);
  }

  /**
   * Save analysis result to the database
   * @param {Object} resultData - The analysis result data
   */
  async saveResult(resultData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.provider.saveResult(resultData);
  }

  /**
   * Get results by campaign
   * @param {string} campaignName - Name of the campaign
   */
  async getResultsByCampaign(campaignName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.provider.getResultsByCampaign(campaignName);
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.provider) {
      await this.provider.disconnect();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseManager();
