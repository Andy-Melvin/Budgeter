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
import { useUpdateAsset, Asset } from "@/hooks/useFinancialData";
import { useCurrency } from "@/hooks/useCurrency";
import { Loader2, Wallet } from "lucide-react";

const editAssetSchema = z.object({
  asset_name: z.string().min(1, "Asset name is required"),
  asset_type: z.string().min(1, "Asset type is required"),
  current_value: z.number().min(0.01, "Current value must be greater than 0"),
  location: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
});

type EditAssetFormData = z.infer<typeof editAssetSchema>;

interface EditAssetFormProps {
  asset: Asset;
  onClose: () => void;
  onSuccess?: () => void;
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

export function EditAssetForm({ asset, onClose, onSuccess }: EditAssetFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EditAssetFormData>({
    resolver: zodResolver(editAssetSchema),
    defaultValues: {
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      current_value: asset.current_value,
      location: asset.location || "",
      description: asset.description || "",
      currency: asset.currency,
    }
  });
  
  const updateAsset = useUpdateAsset();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCurrency = watch("currency");

  const onSubmit = async (data: EditAssetFormData) => {
    setIsSubmitting(true);
    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        updates: {
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          current_value: data.current_value,
          location: data.location || null,
          description: data.description || null,
          currency: data.currency,
        }
      });
      
      toast({
        title: "Asset updated successfully!",
        description: `${data.asset_name} - ${formatCurrency(data.current_value)}`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating asset",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle>Edit Asset</CardTitle>
          <CardDescription>Update your asset information</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset_name">Asset Name</Label>
            <Input
              id="asset_name"
              placeholder="e.g., Savings Account, Car, House"
              {...register("asset_name")}
            />
            {errors.asset_name && (
              <p className="text-sm text-destructive">{errors.asset_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select value={watch("asset_type")} onValueChange={(value) => setValue("asset_type", value)}>
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
              {...register("current_value", { valueAsNumber: true })}
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
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency.message}</p>
            )}
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
              Update Asset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 