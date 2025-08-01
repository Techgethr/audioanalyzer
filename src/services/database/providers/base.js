/**
 * Base database provider interface
 * All database providers must implement these methods
 */

class BaseProvider {
  /**
   * Connect to the database
   */
  async connect() {
    throw new Error('connect() method must be implemented by provider');
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented by provider');
  }

  /**
   * Save analysis result to the database
   * @param {Object} resultData - The analysis result data
   * @param {string} resultData.campaignName - Campaign name
   * @param {string} resultData.fileName - Audio file name
   * @param {string} resultData.transcription - Audio transcription
   * @param {string} resultData.gptResult - GPT analysis result
   * @param {Date} resultData.processedAt - Processing timestamp
   */
  async saveResult(resultData) {
    throw new Error('saveResult() method must be implemented by provider');
  }

  /**
   * Get results by campaign
   * @param {string} campaignName - Name of the campaign
   */
  async getResultsByCampaign(campaignName) {
    throw new Error('getResultsByCampaign() method must be implemented by provider');
  }

  /**
   * Validate result data structure
   * @param {Object} resultData - The result data to validate
   */
  validateResultData(resultData) {
    const required = ['campaignName', 'fileName', 'complianceScore', 'overallFeedback'];
    const missing = required.filter(field => !resultData[field] && resultData[field] !== 0);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Get campaign by folder name
   * @param {string} campaignName - Folder name of the campaign
   */
  async getCampaignByFolderName(campaignName) {
    throw new Error('getCampaignByFolderName() method must be implemented by provider');
  }
}

module.exports = BaseProvider;
