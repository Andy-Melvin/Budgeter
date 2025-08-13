import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Plus, 
  TrendingUp, 
  Building2, 
  Smartphone, 
  PiggyBank, 
  PlusCircle, 
  DollarSign,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useIncomes, useDeleteIncome, IncomeSource } from "@/hooks/useFinancialData";
import { format } from "date-fns";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { EditIncomeForm } from "@/components/forms/EditIncomeForm";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

export default function Income() {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeSource | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeSource | null>(null);
  const { data: incomes, isLoading } = useIncomes();
  const deleteIncome = useDeleteIncome();
  const { toast } = useToast();
  const { formatCurrencyWithCurrency, groupByCurrency } = useCurrency();
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((incomes?.length || 0) / ITEMS_PER_PAGE));
  const paginatedIncomes = incomes?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) || [];

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [incomes, page, totalPages]);

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

  // Calculate totals with currency grouping
  const incomesByCurrency = incomes ? groupByCurrency(incomes.map(income => ({ 
    currency: income.currency, 
    amount: Number(income.amount) 
  }))) : {};

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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Income & Earnings</h1>
            <p className="text-muted-foreground">Track all your income sources</p>
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
          <h1 className="text-3xl font-bold">Income & Earnings</h1>
          <p className="text-muted-foreground">Track all your income sources</p>
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
            <div className="space-y-1">
              {Object.entries(incomesByCurrency).map(([currency, { total }]) => (
                <div key={currency} className="text-2xl font-bold">
                  {formatCurrencyWithCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(incomesByCurrency).length === 0 && (
                <div className="text-2xl font-bold">RWF 0</div>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              All time
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyWithCurrency(thisMonthIncome, "RWF")}</div>
            <Badge variant="secondary" className="mt-2">
              <DollarSign className="w-3 h-3 mr-1" />
              Current month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomes?.length || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <PlusCircle className="w-3 h-3 mr-1" />
              Total entries
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle>All Income Entries</CardTitle>
          <CardDescription>Your complete earnings history</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes && incomes.length > 0 ? (
            <div className="space-y-4">
              {paginatedIncomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {income.source_type === 'salary' && <Building2 className="w-4 h-4 text-primary" />}
                      {income.source_type === 'freelance' && <Smartphone className="w-4 h-4 text-success" />}
                      {income.source_type === 'investment' && <TrendingUp className="w-4 h-4 text-warning" />}
                      {income.source_type === 'business' && <PiggyBank className="w-4 h-4 text-destructive" />}
                      {income.source_type === 'gift' && <PlusCircle className="w-4 h-4 text-muted-foreground" />}
                      {income.source_type === 'other' && <DollarSign className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium">{income.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(income.received_date), 'MMM dd, yyyy')} • {income.source_location}
                        {income.category && ` • ${income.category}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-bold text-success">+{formatCurrencyWithCurrency(Number(income.amount), income.currency)}</p>
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
                          <AlertDialogTitle>Delete Income</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{income.description}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteIncome} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="pt-2 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button key={p} variant={p === page ? "secondary" : "ghost"} size="sm" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No income entries yet. Add your first earnings!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Income Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          {selectedIncome && (
            <EditIncomeForm
              income={selectedIncome}
              onClose={() => {
                setShowEditForm(false);
                setSelectedIncome(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedIncome(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}