import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, TrendingUp, DollarSign, Calendar, Building2, Smartphone, CreditCard, Wallet, Edit, Trash2, Loader2 } from "lucide-react";
import { useIncomes, useDeleteIncome, IncomeSource } from "@/hooks/useFinancialData";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { EditIncomeForm } from "@/components/forms/EditIncomeForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const getSourceIcon = (sourceLocation: string) => {
  switch (sourceLocation) {
    case "bank": return Building2;
    case "mobile_money": return Smartphone;
    case "mocash": return CreditCard;
    case "cash": return Wallet;
    default: return DollarSign;
  }
};

const getSourceTypeColor = (sourceType: string) => {
  switch (sourceType) {
    case "salary": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "freelance": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "investment": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "business": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function Income() {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeSource | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeSource | null>(null);
  const { data: incomes, isLoading } = useIncomes();
  const deleteIncome = useDeleteIncome();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) return;
    
    try {
      await deleteIncome.mutateAsync(incomeToDelete.id);
      toast({
        title: "Income deleted",
        description: `Income "${incomeToDelete.description}" has been deleted.`,
      });
      setIncomeToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const thisMonthIncome = incomes?.filter(income => {
    const incomeDate = new Date(income.received_date);
    const now = new Date();
    return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
  }).reduce((sum, income) => sum + income.amount, 0) || 0;

  if (showForm) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Add Earnings</h1>
            <p className="text-muted-foreground">Record a new earnings entry</p>
          </div>
        </div>
        <IncomeForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)} 
        />
      </div>
    );
  }

  if (showEditForm && selectedIncome) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Edit Earnings</h1>
            <p className="text-muted-foreground">Edit an existing earnings entry</p>
          </div>
        </div>
        <EditIncomeForm 
          income={selectedIncome}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            toast({
              title: "Income updated",
              description: `Income "${selectedIncome?.description}" updated.`,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Earnings Tracker</h1>
          <p className="text-muted-foreground">Monitor all your earnings sources</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Earnings
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              All time
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthIncome)}</div>
            <Badge variant="secondary" className="mt-2">
              <Calendar className="w-3 h-3 mr-1" />
              Current month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earnings Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomes?.length || 0}</div>
            <Badge variant="secondary" className="mt-2">
              Total entries
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Income History
          </CardTitle>
          <CardDescription>All your recorded income sources</CardDescription>
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
          ) : incomes?.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No income recorded yet</h3>
              <p className="text-muted-foreground mb-4">Add your first income source to start tracking</p>
              <Button onClick={() => setShowForm(true)}>Add Your First Income</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {incomes?.map((income) => {
                const SourceIcon = getSourceIcon(income.source_location);
                return (
                  <div key={income.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <SourceIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{income.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge className={getSourceTypeColor(income.source_type)} variant="secondary">
                            {income.source_type}
                          </Badge>
                          <span>•</span>
                          <span>{income.source_location.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(income.received_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="font-bold text-success text-lg">+{formatCurrency(income.amount)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncome(income);
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
                            onClick={() => setIncomeToDelete(income)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your income entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIncomeToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteIncome} disabled={deleteIncome.isPending}>
                              {deleteIncome.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
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