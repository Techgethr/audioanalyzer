# Database Integration Guide

This module provides a scalable database integration for saving audio analysis results to multiple database engines.

## Supported Database Engines

- **Supabase** (default) - PostgreSQL-based backend

## Setup Instructions

### 1. Supabase Setup (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a new table using the SQL script in `schemas/supabase.sql`
3. Copy your project URL and anon key from the Supabase dashboard
4. Update your `.env` file:
   ```
   DB_ENGINE=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_RESULTS_TABLE_NAME=audio_analysis_results
   SUPABASE_CAMPAIGNS_TABLE_NAME=campaign
   ```

## Usage

The database integration automatically saves results when `saveResult` is called. Results are saved to both:
- Local files (as before)
- Database (based on your configuration)

## Database Schema

### Supabase Table Structure
```sql
CREATE TABLE IF NOT EXISTS campaign (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    folder_name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    do_items JSONB NOT NULL,
    dont_items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audio_analysis_results (
    id BIGSERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    transcription TEXT NULL,
    compliance_score INT NOT NULL,
    overall_feedback TEXT NOT NULL,
    predominant_emotion VARCHAR(50) NULL,
    predominant_emotion_justification TEXT NULL,
    professional_tone BOOLEAN NULL,
    empathetic_tone BOOLEAN NULL,
    appropriate_tone BOOLEAN NULL,
    communication_tone_justification TEXT NULL,
    technical_quality_adequate BOOLEAN NULL,
    technical_quality_justification TEXT NULL,
    do_checklist_results JSONB NULL,
    dont_checklist_results JSONB NULL,
    strengths JSONB NULL,
    improvement_areas JSONB NULL,
    processed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (campaign_id) REFERENCES campaign(id)
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ENGINE` | Database engine to use | `supabase` |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anon key | - |
| `SUPABASE_RESULTS_TABLE_NAME` | Supabase results table name | `audio_analysis_results` |
| `SUPABASE_CAMPAIGNS_TABLE_NAME` | Supabase campaigns table name | `campaign` |

## Testing

To test the database integration:

1. Set up your database configuration in `.env`
2. Run the audio analyzer with a test file
3. Check both the local processed files and the database for saved results

## Error Handling

- If database save fails, the file save continues to work
- Errors are logged to console but don't stop processing
- Database connection is automatically initialized on first use

## Extending the System

To add a new database engine:

1. Create a new provider in `providers/` directory
2. Extend the `BaseProvider` class
3. Implement required methods: `connect()`, `disconnect()`, `saveResult()`, `getResultsByCampaign()`, `getCampaignByFolderName()`
4. Update the database manager in `index.js` to include your new provider
