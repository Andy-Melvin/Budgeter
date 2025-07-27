import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateAsset } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Loader2, X } from "lucide-react";

interface AssetFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface AssetFormData {
  asset_name: string;
  asset_type: string;
  current_value: number;
  location?: string;
  description?: string;
  currency: string;
}

const assetTypes = [
  { value: "bank_account", label: "Bank Account" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "mocash", label: "MoCash" },
  { value: "cash", label: "Cash" },
  { value: "property", label: "Property/Real Estate" },
  { value: "investment", label: "Investment/Stocks" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other" },
];

const currencies = [
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF" },
  { code: "USD", name: "US Dollar", symbol: "$" },
];

export function AssetForm({ onClose, onSuccess }: AssetFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AssetFormData>({
    defaultValues: {
      currency: "RWF"
    }
  });
  const createAsset = useCreateAsset();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCurrency = watch("currency");

  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    try {
      await createAsset.mutateAsync(data);
      toast({
        title: "Asset added successfully!",
        description: `${data.asset_name} - ${formatCurrency(data.current_value)}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error adding asset",
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
        <CardTitle>Add Asset</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset_name">Asset Name</Label>
            <Input
              id="asset_name"
              placeholder="e.g., Savings Account, Car, House"
              {...register("asset_name", { required: "Asset name is required" })}
            />
            {errors.asset_name && (
              <p className="text-sm text-destructive">{errors.asset_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select onValueChange={(value) => setValue("asset_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.asset_type && (
              <p className="text-sm text-destructive">{errors.asset_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value">Current Value</Label>
            <Input
              id="current_value"
              type="number"
              step="0.01"
              placeholder="Enter current value"
              {...register("current_value", { 
                required: "Current value is required",
                valueAsNumber: true,
                min: { value: 0, message: "Value cannot be negative" }
              })}
            />
            {errors.current_value && (
              <p className="text-sm text-destructive">{errors.current_value.message}</p>
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
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Bank name, Platform, Physical location"
              {...register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the asset"
              {...register("description")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Asset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}