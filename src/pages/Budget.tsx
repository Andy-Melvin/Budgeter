import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Plus, 
  DollarSign, 
  Target, 
  TrendingUp, 
  FileText,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useBudgetCategories, useProfile, useCurrentEarnings, useDeleteBudgetCategory, BudgetCategory } from "@/hooks/useFinancialData";
import { format } from "date-fns";
import { BudgetCategoryForm } from "@/components/forms/BudgetCategoryForm";
import { EditBudgetCategoryForm } from "@/components/forms/EditBudgetCategoryForm";
import { ReportGenerator } from "@/components/ReportGenerator";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

export default function Budget() {
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BudgetCategory | null>(null);
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const { data: budgetCategories, refetch } = useBudgetCategories(currentMonth);
  const { data: profile } = useProfile();
  const { data: currentEarnings } = useCurrentEarnings();
  const deleteBudgetCategory = useDeleteBudgetCategory();
  const { toast } = useToast();
  const { formatCurrency, formatCurrencyWithCurrency, groupByCurrency } = useCurrency();

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteBudgetCategory.mutateAsync(categoryToDelete.id);
      toast({
        title: "Budget category deleted",
        description: `Budget category "${categoryToDelete.category_name}" has been deleted.`,
      });
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget category. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals with currency grouping
  const budgetByCurrency = budgetCategories ? groupByCurrency(budgetCategories.map(cat => ({ 
    currency: cat.currency, 
    amount: Number(cat.budgeted_amount) 
  }))) : {};

  const spentByCurrency = budgetCategories ? groupByCurrency(budgetCategories.map(cat => ({ 
    currency: cat.currency, 
    amount: Number(cat.spent_amount || 0) 
  }))) : {};

  const totalBudgeted = budgetCategories?.reduce((sum, cat) => sum + Number(cat.budgeted_amount), 0) || 0;
  const totalSpent = budgetCategories?.reduce((sum, cat) => sum + Number(cat.spent_amount || 0), 0) || 0;
  const remainingBudget = totalBudgeted - totalSpent;
  const availableEarnings = currentEarnings || 0;

  if (showBudgetForm) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create Budget Category</h1>
            <p className="text-muted-foreground">Allocate your earnings to spending categories</p>
          </div>
        </div>
        <BudgetCategoryForm 
          onClose={() => setShowBudgetForm(false)} 
          onSuccess={() => {
            setShowBudgetForm(false);
            refetch();
          }} 
        />
      </div>
    );
  }

  if (showReportGenerator) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Generate Report</h1>
            <p className="text-muted-foreground">Create a detailed financial report</p>
          </div>
        </div>
        <ReportGenerator onClose={() => setShowReportGenerator(false)} />
      </div>
    );
  }

  if (showEditForm && selectedCategory) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Edit Budget Category</h1>
            <p className="text-muted-foreground">Update your budget allocation</p>
          </div>
        </div>
        <EditBudgetCategoryForm 
          category={selectedCategory}
          onClose={() => {
            setShowEditForm(false);
            setSelectedCategory(null);
          }} 
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedCategory(null);
            refetch();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Plan and track your monthly spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReportGenerator(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={() => setShowBudgetForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Available Earnings Card */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Available Earnings
          </CardTitle>
          <CardDescription>Your current earnings available for budgeting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-2">{formatCurrency(availableEarnings)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Budgeted</p>
              <div className="space-y-1">
                {Object.entries(budgetByCurrency).map(([currency, { total }]) => (
                  <p key={currency} className="text-xl font-semibold">
                    {formatCurrencyWithCurrency(total, currency)}
                  </p>
                ))}
                {Object.keys(budgetByCurrency).length === 0 && (
                  <p className="text-xl font-semibold">RWF 0</p>
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <div className="space-y-1">
                {Object.entries(spentByCurrency).map(([currency, { total }]) => (
                  <p key={currency} className="text-xl font-semibold text-destructive">
                    {formatCurrencyWithCurrency(total, currency)}
                  </p>
                ))}
                {Object.keys(spentByCurrency).length === 0 && (
                  <p className="text-xl font-semibold text-destructive">RWF 0</p>
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <div className="space-y-1">
                {Object.entries(budgetByCurrency).map(([currency, { total }]) => {
                  const spent = spentByCurrency[currency]?.total || 0;
                  return (
                    <p key={currency} className="text-xl font-semibold text-success">
                      {formatCurrencyWithCurrency(total - spent, currency)}
                    </p>
                  );
                })}
                {Object.keys(budgetByCurrency).length === 0 && (
                  <p className="text-xl font-semibold text-success">RWF 0</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Budget Categories
          </CardTitle>
          <CardDescription>Your monthly budget allocations</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetCategories && budgetCategories.length > 0 ? (
            <div className="space-y-6">
              {budgetCategories.map((category) => {
                const spent = Number(category.spent_amount || 0);
                const budgeted = Number(category.budgeted_amount);
                const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                const remaining = budgeted - spent;
                
                return (
                  <div key={category.id} className="p-6 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{category.category_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {formatCurrencyWithCurrency(budgeted, category.currency)} budgeted
                          </Badge>
                          {category.color && (
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category);
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
                              onClick={() => setCategoryToDelete(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Budget Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.category_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <Progress value={Math.min(progress, 100)} className="h-3 mb-4" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {formatCurrencyWithCurrency(spent, category.currency)} / {formatCurrencyWithCurrency(budgeted, category.currency)}
                        </span>
                        <span className={`font-medium ${progress > 100 ? 'text-destructive' : 'text-primary'}`}>
                          {progress.toFixed(1)}% used
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {remaining > 0 && (
                          <span className="text-success">
                            {formatCurrencyWithCurrency(remaining, category.currency)} remaining
                          </span>
                        )}
                        {remaining < 0 && (
                          <span className="text-destructive">
                            {formatCurrencyWithCurrency(Math.abs(remaining), category.currency)} over budget
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No budget categories for this month. Create your first budget category!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}