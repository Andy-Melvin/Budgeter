import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, CreditCard, Receipt, Banknote, ShoppingCart, Calendar, Edit, Trash2, Loader2 } from "lucide-react";
import { useTransactions, useDeleteTransaction, Transaction } from "@/hooks/useFinancialData";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { EditTransactionForm } from "@/components/forms/EditTransactionForm";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function getCategoryIcon(category: string) {
  switch (category) {
    case 'food':
      return Banknote;
    case 'transportation':
      return CreditCard;
    case 'shopping':
      return ShoppingCart;
    default:
      return Receipt;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'food':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'transportation':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'shopping':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'utilities':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'entertainment':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { data: transactions, isLoading } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  // Calculate totals
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

  if (showEditForm && selectedTransaction) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Edit Transaction</h1>
            <p className="text-muted-foreground">Edit transaction details</p>
          </div>
        </div>
        <EditTransactionForm 
          transaction={selectedTransaction}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedTransaction(null);
            toast({
              title: "Transaction updated",
              description: `Transaction "${selectedTransaction?.description}" updated successfully.`,
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
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">View and manage all your expenses</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <CreditCard className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
            <Badge variant="secondary" className="mt-2 bg-destructive/10 text-destructive">
              All time
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <Calendar className="w-4 h-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(thisMonthExpenses)}</div>
            <Badge variant="secondary" className="mt-2 bg-warning/10 text-warning">
              Current month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <Receipt className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{transactions?.length || 0}</div>
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
              Entries
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Expense History
            </CardTitle>
            <CardDescription>Complete record of your spending activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading expenses...</div>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const IconComponent = getCategoryIcon(transaction.category || '');
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {transaction.category && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getCategoryColor(transaction.category)}`}
                              >
                                {transaction.category}
                              </Badge>
                            )}
                            {transaction.source_location && (
                              <span>• {transaction.source_location}</span>
                            )}
                            <span>• {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="font-bold text-destructive">-{formatCurrency(Number(transaction.amount))}</p>
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
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your transaction.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteTransaction} disabled={deleteTransaction.isPending}>
                                {deleteTransaction.isPending ? (
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
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Track Your Spending</h3>
                <p className="text-muted-foreground mb-4">Record every expense to understand your money flow</p>
                <Button onClick={() => setShowForm(true)}>Add Your First Expense</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}