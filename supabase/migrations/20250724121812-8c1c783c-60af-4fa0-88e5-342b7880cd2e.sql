-- Add current_earnings field to track available money
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_earnings NUMERIC DEFAULT 0;

-- Create function to calculate current earnings from income_sources minus transactions
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

-- Create trigger function to update current earnings after income changes
CREATE OR REPLACE FUNCTION update_current_earnings_after_income()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current earnings for the affected user
    PERFORM calculate_current_earnings(COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update current earnings after transaction changes
CREATE OR REPLACE FUNCTION update_current_earnings_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current earnings for the affected user
    PERFORM calculate_current_earnings(COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update current earnings after goal updates
CREATE OR REPLACE FUNCTION update_current_earnings_after_goal_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only deduct if current_amount increased (money was added to goal)
    IF (NEW.current_amount > OLD.current_amount) THEN
        -- Update current earnings for the user
        PERFORM calculate_current_earnings(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_earnings_after_income_insert ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_income_update ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_income_delete ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_transaction_insert ON transactions;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_transaction_update ON transactions;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_transaction_delete ON transactions;
DROP TRIGGER IF EXISTS trigger_update_earnings_after_goal_update ON financial_goals;

-- Create triggers for income sources
CREATE TRIGGER trigger_update_earnings_after_income_insert
    AFTER INSERT ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_income();

CREATE TRIGGER trigger_update_earnings_after_income_update
    AFTER UPDATE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_income();

CREATE TRIGGER trigger_update_earnings_after_income_delete
    AFTER DELETE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_income();

-- Create triggers for transactions
CREATE TRIGGER trigger_update_earnings_after_transaction_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_transaction();

CREATE TRIGGER trigger_update_earnings_after_transaction_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_transaction();

CREATE TRIGGER trigger_update_earnings_after_transaction_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_transaction();

-- Create trigger for financial goals
CREATE TRIGGER trigger_update_earnings_after_goal_update
    AFTER UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_current_earnings_after_goal_update();

-- Initialize current earnings for existing users
UPDATE profiles 
SET current_earnings = (
    SELECT calculate_current_earnings(profiles.user_id)
    FROM profiles p2 
    WHERE p2.user_id = profiles.user_id
);