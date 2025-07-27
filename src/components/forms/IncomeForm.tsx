import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateIncome } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Loader2, X } from "lucide-react";

interface IncomeFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface IncomeFormData {
  amount: number;
  description: string;
  source_type: string;
  source_location: string;
  received_date: string;
  category?: string;
  currency: string;
}

const sourceTypes = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investment" },
  { value: "business", label: "Business" },
  { value: "gift", label: "Gift" },
  { value: "other", label: "Other" },
];

const sourceLocations = [
  { value: "bank", label: "Bank Account" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "mocash", label: "MoCash" },
  { value: "cash", label: "Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

const currencies = [
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF" },
  { code: "USD", name: "US Dollar", symbol: "$" },
];

export function IncomeForm({ onClose, onSuccess }: IncomeFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<IncomeFormData>({
    defaultValues: {
      currency: "RWF"
    }
  });
  const createIncome = useCreateIncome();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCurrency = watch("currency");

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    try {
      await createIncome.mutateAsync(data);
      toast({
        title: "Earnings added successfully!",
        description: `${data.description} - ${formatCurrency(data.amount)}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error adding earnings",
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
        <CardTitle>Add Earnings</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              {...register("amount", { 
                required: "Amount is required",
                valueAsNumber: true,
                min: { value: 0.01, message: "Amount must be greater than 0" }
              })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Monthly salary, Freelance project"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Source Type</Label>
            <Select onValueChange={(value) => setValue("source_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                {sourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_type && (
              <p className="text-sm text-destructive">{errors.source_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Source Location</Label>
            <Select onValueChange={(value) => setValue("source_location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source location" />
              </SelectTrigger>
              <SelectContent>
                {sourceLocations.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_location && (
              <p className="text-sm text-destructive">{errors.source_location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="received_date">Received Date</Label>
            <Input
              id="received_date"
              type="date"
              {...register("received_date", { required: "Date is required" })}
            />
            {errors.received_date && (
              <p className="text-sm text-destructive">{errors.received_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Work, Side hustle"
              {...register("category")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Earnings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}