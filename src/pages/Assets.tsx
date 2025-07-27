import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  TrendingUp, 
  PieChart, 
  Building2, 
  Smartphone, 
  CreditCard, 
  Wallet, 
  Home, 
  Car, 
  Bitcoin, 
  DollarSign,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import { useAssets, useDeleteAsset, Asset } from "@/hooks/useFinancialData";
import { AssetForm } from "@/components/forms/AssetForm";
import { EditAssetForm } from "@/components/forms/EditAssetForm";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case "bank_account": return Building2;
    case "mobile_money": return Smartphone;
    case "mocash": return CreditCard;
    case "cash": return Wallet;
    case "property": return Home;
    case "vehicle": return Car;
    case "crypto": return Bitcoin;
    default: return DollarSign;
  }
};

export default function Assets() {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const { data: assets, isLoading } = useAssets();
  const deleteAsset = useDeleteAsset();
  const { toast } = useToast();
  const { formatCurrencyWithCurrency, groupByCurrency } = useCurrency();

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    try {
      await deleteAsset.mutateAsync(assetToDelete.id);
      toast({
        title: "Asset deleted successfully!",
        description: `${assetToDelete.asset_name} has been removed from your assets.`,
      });
      setAssetToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting asset",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Calculate totals with currency grouping
  const assetsByCurrency = assets ? groupByCurrency(assets.map(asset => ({ 
    currency: asset.currency, 
    amount: Number(asset.current_value) 
  }))) : {};

  const totalValue = assets?.reduce((sum, asset) => sum + asset.current_value, 0) || 0;
  const assetsByType = assets?.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + asset.current_value;
    return acc;
  }, {} as Record<string, number>) || {};

  if (showForm) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assets & Equity</h1>
            <p className="text-muted-foreground">Track your wealth across all accounts</p>
          </div>
        </div>
        <AssetForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)} 
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assets & Equity</h1>
            <p className="text-muted-foreground">Track your wealth across all accounts</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assets & Equity</h1>
          <p className="text-muted-foreground">Track your wealth across all accounts</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(assetsByCurrency).map(([currency, { total }]) => (
                <div key={currency} className="text-2xl font-bold">
                  {formatCurrencyWithCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(assetsByCurrency).length === 0 && (
                <div className="text-2xl font-bold">RWF 0</div>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Net worth
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asset Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets?.length || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <PieChart className="w-3 h-3 mr-1" />
              Total assets
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asset Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(assetsByType).length}</div>
            <Badge variant="secondary" className="mt-2">
              Diversification
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>Your complete asset portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {assets && assets.length > 0 ? (
            <div className="space-y-4">
              {assets?.map((asset) => {
                const AssetIcon = getAssetIcon(asset.asset_type);
                return (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AssetIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.asset_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.asset_type.replace('_', ' ')} • {asset.location || 'No location'}
                        </p>
                        {asset.description && (
                          <p className="text-sm text-muted-foreground">{asset.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrencyWithCurrency(asset.current_value, asset.currency)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((asset.current_value / totalValue) * 100).toFixed(1)}% of portfolio
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowEditForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssetToDelete(asset)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{asset.asset_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteAsset}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No assets added yet. Add your first asset to start tracking your wealth!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Asset Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          {selectedAsset && (
            <EditAssetForm
              asset={selectedAsset}
              onClose={() => {
                setShowEditForm(false);
                setSelectedAsset(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedAsset(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}