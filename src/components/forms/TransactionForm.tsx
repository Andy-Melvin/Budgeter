import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateTransaction } from "@/hooks/useFinancialData";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface TransactionFormData {
  amount: number;
  description: string;
  transaction_type: string;
  category?: string;
  source_location?: string;
  transaction_date: string;
}

const expenseCategories = [
  { value: "food", label: "Food & Dining" },
  { value: "transportation", label: "Transportation" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" }
];

export function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const createTransaction = useCreateTransaction();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: "expense"
    }
  });

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      await createTransaction.mutateAsync(data);
      toast({
        title: "Expense Added",
        description: "Your expense has been recorded successfully.",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>Record a new expense to track your spending</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (RWF)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { 
                required: "Amount is required",
                min: { value: 0.01, message: "Amount must be greater than 0" }
              })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What did you spend on?"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_location">Where</Label>
            <Input
              id="source_location"
              placeholder="Store, restaurant, etc."
              {...register("source_location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_date">Date</Label>
            <Input
              id="transaction_date"
              type="date"
              {...register("transaction_date", { required: "Date is required" })}
            />
            {errors.transaction_date && (
              <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Expense
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}