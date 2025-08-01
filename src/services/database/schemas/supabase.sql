-- Supabase table schema for audio analysis results
-- Run this SQL in your Supabase SQL editor to create the required table

CREATE TABLE IF NOT EXISTS audio_analysis_results (
    id BIGSERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Optional: Add Row Level Security (RLS) if needed
-- ALTER TABLE audio_analysis_results ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy for authenticated users
-- CREATE POLICY "Users can view their own results" ON audio_analysis_results
--     FOR SELECT USING (auth.uid() = user_id);

-- Optional: Add a user_id column if you want to associate results with specific users
-- ALTER TABLE audio_analysis_results ADD COLUMN user_id UUID REFERENCES auth.users(id);
