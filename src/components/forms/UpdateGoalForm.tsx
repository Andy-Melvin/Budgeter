import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus } from "lucide-react";
import { FinancialGoal, useUpdateGoalAmount, useProfile, useCurrentEarnings } from "@/hooks/useFinancialData";

interface UpdateGoalFormProps {
  goal: FinancialGoal;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UpdateGoalFormData {
  amount: number;
  action: 'add' | 'subtract';
}

export function UpdateGoalForm({ goal, onClose, onSuccess }: UpdateGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const { toast } = useToast();
  const updateGoalAmount = useUpdateGoalAmount();
  const { data: profile } = useProfile();
  const { data: availableEarnings } = useCurrentEarnings();

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateGoalFormData>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: UpdateGoalFormData) => {
    setIsSubmitting(true);
    try {
      const currentAmount = Number(goal.current_amount || 0);
      const changeAmount = Number(data.amount);
      
      let newAmount;
      if (action === 'add') {
        // Check if user has enough earnings to add to goal
        if (changeAmount > (availableEarnings || 0)) {
          toast({
            title: "Insufficient Earnings",
            description: `You only have ${formatCurrency(availableEarnings || 0)} available. Cannot add ${formatCurrency(changeAmount)} to goal.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        newAmount = currentAmount + changeAmount;
      } else {
        newAmount = Math.max(0, currentAmount - changeAmount); // Don't go below 0
      }

      await updateGoalAmount.mutateAsync({ goalId: goal.id, newAmount });

      toast({
        title: "Goal Updated",
        description: `Successfully ${action === 'add' ? 'added' : 'subtracted'} ${formatCurrency(changeAmount)} ${action === 'add' ? 'to' : 'from'} your goal.`,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Update Goal Progress</CardTitle>
        <CardDescription>Add or subtract money from "{goal.goal_name}"</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Progress</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(goal.current_amount || 0))}</p>
            <p className="text-sm text-muted-foreground">
              of {formatCurrency(Number(goal.target_amount))} ({Math.round(progress)}%)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={action === 'add' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setAction('add')}
              >
                <Plus className="w-4 h-4" />
                Add Money
              </Button>
              <Button
                type="button"
                variant={action === 'subtract' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setAction('subtract')}
              >
                <Minus className="w-4 h-4" />
                Subtract Money
              </Button>
            </div>
          </div>

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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'add' ? 'Add' : 'Subtract'} Money
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}