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
import { useUpdateIncome, IncomeSource } from "@/hooks/useFinancialData";
import { Loader2, DollarSign } from "lucide-react";
import { format } from "date-fns";

const editIncomeSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  source_type: z.string().min(1, "Source type is required"),
  source_location: z.string().min(1, "Source location is required"),
  received_date: z.string().min(1, "Date is required"),
  category: z.string().optional(),
});

type EditIncomeFormData = z.infer<typeof editIncomeSchema>;

interface EditIncomeFormProps {
  income: IncomeSource;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditIncomeForm({ income, onClose, onSuccess }: EditIncomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateIncome = useUpdateIncome();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditIncomeFormData>({
    resolver: zodResolver(editIncomeSchema),
    defaultValues: {
      amount: income.amount,
      description: income.description,
      source_type: income.source_type,
      source_location: income.source_location,
      received_date: format(new Date(income.received_date), 'yyyy-MM-dd'),
      category: income.category || "",
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: EditIncomeFormData) => {
    setIsSubmitting(true);
    try {
      await updateIncome.mutateAsync({
        id: income.id,
        updates: {
          amount: data.amount,
          description: data.description,
          source_type: data.source_type,
          source_location: data.source_location,
          received_date: data.received_date,
          category: data.category || null,
        },
      });

      toast({
        title: "Income Updated",
        description: `Successfully updated ${data.description} - ${formatCurrency(data.amount)}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update income. Please try again.",
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
          <DollarSign className="w-5 h-5" />
          Edit Income
        </CardTitle>
        <CardDescription>
          Update your income entry details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (RWF)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="e.g., Salary from Company XYZ"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">Source Type</Label>
            <Select onValueChange={(value) => setValue("source_type", value)} defaultValue={income.source_type}>
              <SelectTrigger>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.source_type && (
              <p className="text-sm text-destructive">{errors.source_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_location">Source Location</Label>
            <Input
              id="source_location"
              {...register("source_location")}
              placeholder="e.g., Kigali, Rwanda"
            />
            {errors.source_location && (
              <p className="text-sm text-destructive">{errors.source_location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="received_date">Received Date</Label>
            <Input
              id="received_date"
              type="date"
              {...register("received_date")}
            />
            {errors.received_date && (
              <p className="text-sm text-destructive">{errors.received_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="e.g., Primary Income"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
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
                "Update Income"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 