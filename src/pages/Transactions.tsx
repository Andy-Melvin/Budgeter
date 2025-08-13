import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Plus, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useTransactions, useDeleteTransaction, Transaction } from "@/hooks/useFinancialData";
import { format } from "date-fns";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { EditTransactionForm } from "@/components/forms/EditTransactionForm";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { data: transactions, isLoading } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();
  const { formatCurrencyWithCurrency, groupByCurrency } = useCurrency();
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE));
  const paginatedTransactions = transactions?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) || [];

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [transactions, page, totalPages]);

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction.mutateAsync(transactionToDelete.id);
      toast({
        title: "Transaction deleted",
        description: `Transaction "${transactionToDelete.description}" has been deleted.`,
      });
      setTransactionToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals with currency grouping
  const transactionsByCurrency = transactions ? groupByCurrency(transactions.map(transaction => ({ 
    currency: transaction.currency, 
    amount: Number(transaction.amount) 
  }))) : {};

  const totalExpenses = transactions?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
  const thisMonthExpenses = transactions?.filter(transaction => 
    format(new Date(transaction.transaction_date), 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  ).reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;

  if (showForm) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Add Expense</h1>
            <p className="text-muted-foreground">Record a new expense</p>
          </div>
        </div>
        <TransactionForm 
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
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Track all your expenses</p>
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
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track all your expenses</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(transactionsByCurrency).map(([currency, { total }]) => (
                <div key={currency} className="text-2xl font-bold text-destructive">
                  {formatCurrencyWithCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(transactionsByCurrency).length === 0 && (
                <div className="text-2xl font-bold text-destructive">RWF 0</div>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingDown className="w-3 h-3 mr-1" />
              All time
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrencyWithCurrency(thisMonthExpenses, "RWF")}</div>
            <Badge variant="secondary" className="mt-2">
              <Calendar className="w-3 h-3 mr-1" />
              Current month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            <Badge variant="secondary" className="mt-2">
              <CreditCard className="w-3 h-3 mr-1" />
              Total transactions
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Your complete expense history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')} • {transaction.category || 'No category'}
                        {transaction.source_location && ` • ${transaction.source_location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-bold text-destructive">-{formatCurrencyWithCurrency(Number(transaction.amount), transaction.currency)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
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
                          onClick={() => setTransactionToDelete(transaction)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{transaction.description}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
              No transactions yet. Add your first expense!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          {selectedTransaction && (
            <EditTransactionForm
              transaction={selectedTransaction}
              onClose={() => {
                setShowEditForm(false);
                setSelectedTransaction(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedTransaction(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}