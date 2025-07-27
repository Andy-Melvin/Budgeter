import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateGoal } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

interface GoalFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface GoalFormData {
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: string;
}

const priorities = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" },
];

export function GoalForm({ onClose, onSuccess }: GoalFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<GoalFormData>({
    defaultValues: {
      current_amount: 0,
      priority: "medium"
    }
  });
  const createGoal = useCreateGoal();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: GoalFormData) => {
    setIsSubmitting(true);
    try {
      await createGoal.mutateAsync(data);
      toast({
        title: "Goal created successfully!",
        description: `${data.goal_name} - Target: ${new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(data.target_amount)}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error creating goal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Financial Goal</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Buy a Car, Emergency Fund"
              {...register("goal_name", { required: "Goal name is required" })}
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
              placeholder="Enter target amount"
              {...register("target_amount", { 
                required: "Target amount is required",
                valueAsNumber: true,
                min: { value: 0.01, message: "Target amount must be greater than 0" }
              })}
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
              placeholder="How much do you already have?"
              {...register("current_amount", { 
                valueAsNumber: true,
                min: { value: 0, message: "Current amount cannot be negative" }
              })}
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
              {...register("target_date", { required: "Target date is required" })}
            />
            {errors.target_date && (
              <p className="text-sm text-destructive">{errors.target_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value) => setValue("priority", value)} defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Goal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}