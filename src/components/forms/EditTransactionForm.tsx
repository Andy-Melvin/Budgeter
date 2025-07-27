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
import { useUpdateTransaction, Transaction } from "@/hooks/useFinancialData";
import { Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";

const editTransactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  transaction_type: z.string().min(1, "Transaction type is required"),
  category: z.string().optional(),
  source_location: z.string().optional(),
  transaction_date: z.string().min(1, "Date is required"),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

interface EditTransactionFormProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTransactionForm({ transaction, onClose, onSuccess }: EditTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateTransaction = useUpdateTransaction();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      amount: transaction.amount,
      description: transaction.description,
      transaction_type: transaction.transaction_type,
      category: transaction.category || "",
      source_location: transaction.source_location || "",
      transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd'),
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: EditTransactionFormData) => {
    setIsSubmitting(true);
    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        updates: {
          amount: data.amount,
          description: data.description,
          transaction_type: data.transaction_type,
          category: data.category || null,
          source_location: data.source_location || null,
          transaction_date: data.transaction_date,
        },
      });

      toast({
        title: "Transaction Updated",
        description: `Successfully updated ${data.description} - ${formatCurrency(data.amount)}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
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
          <CreditCard className="w-5 h-5" />
          Edit Transaction
        </CardTitle>
        <CardDescription>
          Update your transaction details
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
              placeholder="e.g., Grocery shopping at supermarket"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_type">Transaction Type</Label>
            <Select onValueChange={(value) => setValue("transaction_type", value)} defaultValue={transaction.transaction_type}>
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            {errors.transaction_type && (
              <p className="text-sm text-destructive">{errors.transaction_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="e.g., Food, Transport, Entertainment"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_location">Location (Optional)</Label>
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
            <Label htmlFor="transaction_date">Transaction Date</Label>
            <Input
              id="transaction_date"
              type="date"
              {...register("transaction_date")}
            />
            {errors.transaction_date && (
              <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
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
                "Update Transaction"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 