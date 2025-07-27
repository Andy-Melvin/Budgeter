import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUpdateBudgetCategory, BudgetCategory } from "@/hooks/useFinancialData";
import { Loader2, PiggyBank } from "lucide-react";

const editBudgetCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
  budgeted_amount: z.number().min(0.01, "Budget amount must be greater than 0"),
  spent_amount: z.number().min(0, "Spent amount cannot be negative"),
});

type EditBudgetCategoryFormData = z.infer<typeof editBudgetCategorySchema>;

interface EditBudgetCategoryFormProps {
  category: BudgetCategory;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditBudgetCategoryForm({ category, onClose, onSuccess }: EditBudgetCategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateBudgetCategory = useUpdateBudgetCategory();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<EditBudgetCategoryFormData>({
    resolver: zodResolver(editBudgetCategorySchema),
    defaultValues: {
      category_name: category.category_name,
      budgeted_amount: category.budgeted_amount,
      spent_amount: category.spent_amount,
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: EditBudgetCategoryFormData) => {
    setIsSubmitting(true);
    try {
      await updateBudgetCategory.mutateAsync({
        id: category.id,
        updates: {
          category_name: data.category_name,
          budgeted_amount: data.budgeted_amount,
          spent_amount: data.spent_amount,
        },
      });

      toast({
        title: "Budget Category Updated",
        description: `Successfully updated "${data.category_name}" - Budget: ${formatCurrency(data.budgeted_amount)}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget category. Please try again.",
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
          Edit Budget Category
        </CardTitle>
        <CardDescription>
          Update your budget category details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_name">Category Name</Label>
            <Input
              id="category_name"
              {...register("category_name")}
              placeholder="e.g., Food, Transport, Entertainment"
            />
            {errors.category_name && (
              <p className="text-sm text-destructive">{errors.category_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgeted_amount">Budget Amount (RWF)</Label>
            <Input
              id="budgeted_amount"
              type="number"
              step="0.01"
              {...register("budgeted_amount", { valueAsNumber: true })}
              placeholder="Enter budget amount"
            />
            {errors.budgeted_amount && (
              <p className="text-sm text-destructive">{errors.budgeted_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="spent_amount">Spent Amount (RWF)</Label>
            <Input
              id="spent_amount"
              type="number"
              step="0.01"
              {...register("spent_amount", { valueAsNumber: true })}
              placeholder="Enter spent amount"
            />
            {errors.spent_amount && (
              <p className="text-sm text-destructive">{errors.spent_amount.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 