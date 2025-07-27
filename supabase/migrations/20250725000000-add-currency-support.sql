-- Add currency column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Add currency column to income_sources table
ALTER TABLE public.income_sources 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Add currency column to assets table
ALTER TABLE public.assets 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Add currency column to financial_goals table
ALTER TABLE public.financial_goals 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Add currency column to budget_categories table
ALTER TABLE public.budget_categories 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Add currency column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency TEXT DEFAULT 'RWF';

-- Create index for better performance on currency queries
CREATE INDEX idx_income_sources_currency ON public.income_sources(currency);
CREATE INDEX idx_assets_currency ON public.assets(currency);
CREATE INDEX idx_financial_goals_currency ON public.financial_goals(currency);
CREATE INDEX idx_budget_categories_currency ON public.budget_categories(currency);
CREATE INDEX idx_transactions_currency ON public.transactions(currency); 