-- Add color column to budget_categories table
ALTER TABLE public.budget_categories 
ADD COLUMN color TEXT DEFAULT '#3b82f6'; 