import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, Building2, Smartphone, CreditCard, DollarSign, TrendingUp, PieChart, Trash2, Loader2 } from "lucide-react";
import { useAssets, useDeleteAsset } from "@/hooks/useFinancialData";
import { AssetForm } from "@/components/forms/AssetForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case "bank_account": return Building2;
    case "mobile_money": return Smartphone;
    case "mocash": return CreditCard;
    case "cash": return Wallet;
    case "property": return Building2;
    case "investment": return TrendingUp;
    case "crypto": return DollarSign;
    default: return Wallet;
  }
};

const getAssetTypeColor = (assetType: string) => {
  switch (assetType) {
    case "bank_account": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "mobile_money": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "mocash": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "cash": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "property": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "investment": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
    case "crypto": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function Assets() {
  const [showForm, setShowForm] = useState(false);
  const { data: assets, isLoading } = useAssets();
  const deleteAsset = useDeleteAsset();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    try {
      await deleteAsset.mutateAsync(assetId);
      toast({
        title: "Asset deleted successfully!",
        description: `${assetName} has been removed from your assets.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting asset",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
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
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Assets
          </CardTitle>
          <CardDescription>Overview of all your financial assets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : assets?.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets recorded yet</h3>
              <p className="text-muted-foreground mb-4">Add your first asset to start tracking your wealth</p>
              <Button onClick={() => setShowForm(true)}>Add Your First Asset</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assets?.map((asset) => {
                const AssetIcon = getAssetIcon(asset.asset_type);
                return (
                  <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AssetIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.asset_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge className={getAssetTypeColor(asset.asset_type)} variant="secondary">
                            {asset.asset_type.replace('_', ' ')}
                          </Badge>
                          {asset.location && (
                            <>
                              <span>•</span>
                              <span>{asset.location}</span>
                            </>
                          )}
                        </div>
                        {asset.description && (
                          <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(asset.current_value)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((asset.current_value / totalValue) * 100).toFixed(1)}% of portfolio
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteAsset.isPending}
                          >
                            {deleteAsset.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{asset.asset_name}"? This action cannot be undone and will permanently remove this asset from your portfolio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAsset(asset.id, asset.asset_name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleteAsset.isPending}
                            >
                              {deleteAsset.isPending ? "Deleting..." : "Delete Asset"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}