import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Types
export interface IncomeSource {
  id: string;
  amount: number;
  description: string;
  source_type: string;
  source_location: string;
  received_date: string;
  category?: string;
  currency: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  current_value: number;
  location?: string;
  description?: string;
  currency: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: string;
  currency: string;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
  month_year: string;
  color?: string;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_type: string;
  category?: string;
  source_location?: string;
  transaction_date: string;
  budget_category_id?: string;
  currency: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  date_of_birth?: string;
  monthly_income_goal?: number;
  savings_goal_percentage?: number;
  current_earnings: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Custom hooks for data fetching
export function useIncomes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["incomes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .order("received_date", { ascending: false });
      
      if (error) throw error;
      return data as IncomeSource[];
    },
    enabled: !!user,
  });
}

export function useAssets() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["assets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!user,
  });
}

export function useGoals() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("target_date", { ascending: true });
      
      if (error) throw error;
      return data as FinancialGoal[];
    },
    enabled: !!user,
  });
}

export function useBudgetCategories(monthYear: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["budget-categories", user?.id, monthYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("month_year", monthYear)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as BudgetCategory[];
    },
    enabled: !!user,
  });
}

export function useTransactions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useCurrentEarnings() {
  const { user } = useAuth();
  const { data: incomes } = useIncomes();
  const { data: transactions } = useTransactions();
  const { data: goals } = useGoals();
  
  return useQuery({
    queryKey: ["current-earnings", user?.id, incomes, transactions, goals],
    queryFn: async () => {
      // Calculate total income
      const totalIncome = incomes?.reduce((sum, income) => sum + Number(income.amount), 0) || 0;
      
      // Calculate total expenses
      const totalExpenses = transactions?.filter(t => t.transaction_type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
      
      // Calculate total money in goals
      const totalInGoals = goals?.reduce((sum, goal) => sum + Number(goal.current_amount), 0) || 0;
      
      // Current earnings = income - expenses - money in goals
      const currentEarnings = totalIncome - totalExpenses - totalInGoals;
      
      return Math.max(0, currentEarnings); // Don't go below 0
    },
    enabled: !!user,
  });
}

// Mutations
export function useCreateIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<IncomeSource, "id" | "created_at">) => {
      const { data: result, error } = await supabase
        .from("income_sources")
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<Asset, "id" | "created_at">) => {
      const { data: result, error } = await supabase
        .from("assets")
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<FinancialGoal, "id" | "created_at">) => {
      const { data: result, error } = await supabase
        .from("financial_goals")
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<BudgetCategory, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("budget_categories")
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories", user?.id] });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("transactions")
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

// Update mutations
export function useUpdateIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<IncomeSource> }) => {
      const { data, error } = await supabase
        .from("income_sources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FinancialGoal> }) => {
      const { data, error } = await supabase
        .from("financial_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}

export function useUpdateBudgetCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BudgetCategory> }) => {
      const { data, error } = await supabase
        .from("budget_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories", user?.id] });
    },
  });
}

export function useUpdateGoalAmount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ goalId, newAmount }: { goalId: string; newAmount: number }) => {
      const { data, error } = await supabase
        .from("financial_goals")
        .update({ current_amount: newAmount })
        .eq("id", goalId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

// Delete mutations
export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("income_sources")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}

export function useDeleteBudgetCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories", user?.id] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-earnings", user?.id] });
    },
  });
}