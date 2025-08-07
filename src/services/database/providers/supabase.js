/**
 * Supabase database provider implementation
 */

const { createClient } = require('@supabase/supabase-js');
const BaseProvider = require('./base');
const config = require('../config');

class SupabaseProvider extends BaseProvider {
  constructor() {
    super();
    this.client = null;
    this.resultsTableName = null;
    this.campaignsTableName = null;
  }

  /**
   * Connect to Supabase
   */
  async connect() {
    try {
      config.validateConfig();
      const dbConfig = config.getConfig();
      
      this.client = createClient(dbConfig.url, dbConfig.key);
      this.resultsTableName = dbConfig.resultsTableName;
      this.campaignsTableName = dbConfig.campaignsTableName;
      
      // Test connection by attempting to select from the table
      const { error } = await this.client
        .from(this.resultsTableName)
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "table doesn't exist"
        throw error;
      }
      
      console.log('Connected to Supabase successfully');
    } catch (error) {
      console.error('Failed to connect to Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from Supabase (no explicit disconnect needed)
   */
  async disconnect() {
    this.client = null;
    console.log('Disconnected from Supabase');
  }

  /**
   * Save analysis result to Supabase
   * @param {Object} resultData - The analysis result data
   */
  async saveResult(resultData) {
    try {
      this.validateResultData(resultData);
      
      const record = {
        campaign_name: resultData.campaignName,
        campaign_id: resultData.campaignId,
        file_name: resultData.fileName,
        transcription: resultData.transcription,
        compliance_score: resultData.complianceScore,
        overall_feedback: resultData.overallFeedback,
        predominant_emotion: resultData.predominantEmotion,
        predominant_emotion_justification: resultData.predominantEmotionJustification,
        professional_tone: resultData.professionalTone,
        empathetic_tone: resultData.empatheticTone,
        appropriate_tone: resultData.appropriateTone,
        communication_tone_justification: resultData.communicationToneJustification,
        technical_quality_adequate: resultData.technicalQualityAdequate,
        technical_quality_justification: resultData.technicalQualityJustification,
        do_checklist_results: resultData.doChecklistResults,
        dont_checklist_results: resultData.dontChecklistResults,
        strengths: resultData.strengths,
        improvement_areas: resultData.improvementAreas,
        processed_at: resultData.processedAt || new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from(this.resultsTableName)
        .insert([record])
        .select();

      if (error) {
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Failed to save result to Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Get results by campaign from Supabase
   * @param {string} campaignName - Name of the campaign
   */
  async getResultsByCampaign(campaignName) {
    try {
      const { data, error } = await this.client
        .from(this.resultsTableName)
        .select('*')
        .eq('campaign_name', campaignName)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get results from Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Get all campaigns
   */
  async getAllCampaigns() {
    try {
      const { data, error } = await this.client
        .from(this.campaignsTableName)
        .select('name')
        .order('name');

      if (error) {
        throw error;
      }

      // Return unique campaign names
      const uniqueCampaigns = [...new Set(data.map(row => row.name))];
      return uniqueCampaigns;
    } catch (error) {
      console.error('Failed to get campaigns from Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Get campaign by folder name
   * @param {string} campaignName - Folder of the campaign
   */
  async getCampaignByFolderName(campaignName) {
    try {
      const { data, error } = await this.client
        .from(this.campaignsTableName)
        .select('*')
        .eq('folder_name', campaignName)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('Failed to get campaign from Supabase:', error.message);
      throw error;
    }
  }
}

module.exports = SupabaseProvider;
