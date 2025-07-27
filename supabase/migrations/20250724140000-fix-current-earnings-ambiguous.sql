-- Fix ambiguous current_earnings reference in calculate_current_earnings function
CREATE OR REPLACE FUNCTION calculate_current_earnings(user_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_income NUMERIC := 0;
    total_expenses NUMERIC := 0;
    calculated_earnings NUMERIC := 0;
BEGIN
    -- Calculate total income
    SELECT COALESCE(SUM(amount), 0) INTO total_income
    FROM income_sources 
    WHERE user_id = user_id_param;
    
    -- Calculate total expenses
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM transactions 
    WHERE user_id = user_id_param AND transaction_type = 'expense';
    
    -- Calculate current earnings
    calculated_earnings := total_income - total_expenses;
    
    -- Update the profile with current earnings
    UPDATE profiles 
    SET current_earnings = calculated_earnings 
    WHERE user_id = user_id_param;
    
    RETURN calculated_earnings;
END;
$$ LANGUAGE plpgsql; 