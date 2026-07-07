-- Add output_config column to llm_workflow_node table
-- This column stores the output parameter configuration as JSON
ALTER TABLE llm_workflow_node ADD COLUMN output_config TEXT COMMENT 'Output parameter config JSON';
