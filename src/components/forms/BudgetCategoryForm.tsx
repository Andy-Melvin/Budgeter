import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateBudgetCategory, useProfile, useCurrentEarnings } from "@/hooks/useFinancialData";
import { Loader2, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

interface BudgetCategoryFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface BudgetCategoryFormData {
  category_name: string;
  budgeted_amount: number;
  currency: string;
  color: string;
}

const predefinedColors = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f59e0b", label: "Yellow" },
  { value: "#ef4444", label: "Red" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#84cc16", label: "Lime" },
  { value: "#f97316", label: "Orange" },
];

const currencies = [
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF" },
  { code: "USD", name: "US Dollar", symbol: "$" },
];

export function BudgetCategoryForm({ onClose, onSuccess }: BudgetCategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const createBudgetCategory = useCreateBudgetCategory();
  const { data: profile } = useProfile();
  const { data: currentEarnings } = useCurrentEarnings();
  const { formatCurrency } = useCurrency();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetCategoryFormData>({
    defaultValues: {
      color: predefinedColors[0].value,
      currency: "RWF"
    }
  });

  const selectedColor = watch("color");
  const selectedCurrency = watch("currency");

  const onSubmit = async (data: BudgetCategoryFormData) => {
    
    if (data.budgeted_amount > (currentEarnings || 0)) {
      toast({
        title: "Insufficient Earnings",
        description: `You only have ${formatCurrency(currentEarnings || 0)} available. Cannot budget ${formatCurrency(data.budgeted_amount)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      await createBudgetCategory.mutateAsync({
        category_name: data.category_name,
        budgeted_amount: data.budgeted_amount,
        currency: data.currency,
        month_year: currentMonth,
        spent_amount: 0
      });
      
      toast({
        title: "Budget Category Created",
        description: `Successfully created budget for ${data.category_name} with ${formatCurrency(data.budgeted_amount)}.`,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Budget creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create budget category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          Create Budget Category
        </CardTitle>
        <CardDescription>
          Allocate part of your current earnings ({formatCurrency(currentEarnings || 0)}) to a spending category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., Food, Transport, Entertainment"
              {...register("category_name", { required: "Category name is required" })}
            />
            {errors.category_name && (
              <p className="text-sm text-destructive">{errors.category_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgeted_amount">Budget Amount</Label>
            <Input
              id="budgeted_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("budgeted_amount", { 
                required: "Budget amount is required",
                min: { value: 0.01, message: "Amount must be greater than 0" },
                max: { value: currentEarnings || 0, message: `Cannot exceed available earnings of ${formatCurrency(currentEarnings || 0)}` }
              })}
            />
            {errors.budgeted_amount && (
              <p className="text-sm text-destructive">{errors.budgeted_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={selectedCurrency} onValueChange={(value) => setValue("currency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currency.symbol}</span>
                      <span className="text-muted-foreground">{currency.name}</span>
                      <span className="text-xs text-muted-foreground">({currency.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-full h-10 rounded-md border-2 transition-all ${
                    selectedColor === color.value 
                      ? 'border-primary scale-110' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setValue("color", color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Budget
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}