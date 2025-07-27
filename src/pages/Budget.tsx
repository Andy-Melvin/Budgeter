import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, PieChart, Calculator, FileText, DollarSign, Edit, Trash2, Loader2 } from "lucide-react";
import { useBudgetCategories, useProfile, useCurrentEarnings, useDeleteBudgetCategory, BudgetCategory } from "@/hooks/useFinancialData";
import { BudgetCategoryForm } from "@/components/forms/BudgetCategoryForm";
import { EditBudgetCategoryForm } from "@/components/forms/EditBudgetCategoryForm";
import { ReportGenerator } from "@/components/ReportGenerator";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  const totalBudgeted = budgetCategories?.reduce((sum, cat) => sum + Number(cat.budgeted_amount), 0) || 0;
  const totalSpent = budgetCategories?.reduce((sum, cat) => sum + Number(cat.spent_amount || 0), 0) || 0;
  const remainingBudget = totalBudgeted - totalSpent;
  const availableEarnings = currentEarnings || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monthly Budget</h1>
          <p className="text-muted-foreground">Plan and track your monthly spending based on current earnings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowReportGenerator(true)}>
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
          <Button className="gap-2" onClick={() => setShowBudgetForm(true)}>
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Current Earnings Summary */}
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
              <p className="text-xl font-semibold">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-semibold text-destructive">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold text-success">{formatCurrency(remainingBudget)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <div className="grid gap-6">
        {budgetCategories && budgetCategories.length > 0 ? (
          <div className="grid gap-4">
            {budgetCategories.map((category) => {
              const spent = Number(category.spent_amount || 0);
              const budgeted = Number(category.budgeted_amount);
              const progress = (spent / budgeted) * 100;
              const remaining = budgeted - spent;
              
              return (
                <Card key={category.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        />
                        <h3 className="font-semibold text-lg">{category.category_name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={progress > 90 ? "destructive" : progress > 70 ? "secondary" : "default"}>
                          {Math.round(progress)}% used
                        </Badge>
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
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your budget category and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCategory} disabled={deleteBudgetCategory.isPending}>
                                {deleteBudgetCategory.isPending ? (
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
                    
                    <Progress value={Math.min(progress, 100)} className="mb-4" />
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budgeted</p>
                        <p className="font-semibold">{formatCurrency(budgeted)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-semibold text-destructive">{formatCurrency(spent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className={`font-semibold ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Budget Planning
              </CardTitle>
              <CardDescription>Allocate your earnings across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create Your First Budget</h3>
                <p className="text-muted-foreground mb-4">
                  You have {formatCurrency(availableEarnings)} available to budget across categories
                </p>
                <Button onClick={() => setShowBudgetForm(true)}>Setup Budget</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
        <DialogContent className="sm:max-w-md">
          <BudgetCategoryForm 
            onClose={() => setShowBudgetForm(false)}
            onSuccess={() => refetch()}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReportGenerator} onOpenChange={setShowReportGenerator}>
        <DialogContent className="sm:max-w-md">
          <ReportGenerator onClose={() => setShowReportGenerator(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Budget Category Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-md">
          {selectedCategory && (
            <EditBudgetCategoryForm 
              category={selectedCategory}
              onClose={() => setShowEditForm(false)}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedCategory(null);
                refetch();
                toast({
                  title: "Budget category updated",
                  description: `Budget category "${selectedCategory?.category_name}" updated successfully.`,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}