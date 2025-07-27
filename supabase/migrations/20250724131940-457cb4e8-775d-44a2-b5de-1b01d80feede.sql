-- Fix income_sources table schema mismatch
ALTER TABLE income_sources 
RENAME COLUMN date TO received_date;

ALTER TABLE income_sources 
ADD COLUMN category TEXT;

-- Fix assets table schema mismatch  
ALTER TABLE assets 
RENAME COLUMN value TO current_value;

ALTER TABLE assets 
ADD COLUMN location TEXT;

ALTER TABLE assets 
ADD COLUMN description TEXT;

-- Fix transactions table schema mismatch
ALTER TABLE transactions 
RENAME COLUMN date TO transaction_date;

ALTER TABLE transactions 
RENAME COLUMN location TO source_location;

ALTER TABLE transactions 
ADD COLUMN budget_category_id UUID REFERENCES budget_categories(id);