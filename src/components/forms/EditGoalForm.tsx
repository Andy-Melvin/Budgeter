import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUpdateGoal, FinancialGoal } from "@/hooks/useFinancialData";
import { Loader2, Target } from "lucide-react";
import { format } from "date-fns";

const editGoalSchema = z.object({
  goal_name: z.string().min(1, "Goal name is required"),
  target_amount: z.number().min(0.01, "Target amount must be greater than 0"),
  current_amount: z.number().min(0, "Current amount cannot be negative"),
  target_date: z.string().min(1, "Target date is required"),
  priority: z.string().min(1, "Priority is required"),
});

type EditGoalFormData = z.infer<typeof editGoalSchema>;

interface EditGoalFormProps {
  goal: FinancialGoal;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditGoalForm({ goal, onClose, onSuccess }: EditGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateGoal = useUpdateGoal();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditGoalFormData>({
    resolver: zodResolver(editGoalSchema),
    defaultValues: {
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: format(new Date(goal.target_date), 'yyyy-MM-dd'),
      priority: goal.priority,
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: EditGoalFormData) => {
    setIsSubmitting(true);
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        updates: {
          goal_name: data.goal_name,
          target_amount: data.target_amount,
          current_amount: data.current_amount,
          target_date: data.target_date,
          priority: data.priority,
        },
      });

      toast({
        title: "Goal Updated",
        description: `Successfully updated "${data.goal_name}" - Target: ${formatCurrency(data.target_amount)}`,
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Edit Financial Goal
        </CardTitle>
        <CardDescription>
          Update your financial goal details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal_name">Goal Name</Label>
            <Input
              id="goal_name"
              {...register("goal_name")}
              placeholder="e.g., Buy a House"
            />
            {errors.goal_name && (
              <p className="text-sm text-destructive">{errors.goal_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Target Amount (RWF)</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              {...register("target_amount", { valueAsNumber: true })}
              placeholder="Enter target amount"
            />
            {errors.target_amount && (
              <p className="text-sm text-destructive">{errors.target_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_amount">Current Amount (RWF)</Label>
            <Input
              id="current_amount"
              type="number"
              step="0.01"
              {...register("current_amount", { valueAsNumber: true })}
              placeholder="Enter current amount saved"
            />
            {errors.current_amount && (
              <p className="text-sm text-destructive">{errors.current_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input
              id="target_date"
              type="date"
              {...register("target_date")}
            />
            {errors.target_date && (
              <p className="text-sm text-destructive">{errors.target_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value) => setValue("priority", value)} defaultValue={goal.priority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
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
                "Update Goal"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 