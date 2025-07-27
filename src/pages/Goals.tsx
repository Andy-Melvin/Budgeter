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
  Target, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useGoals, useDeleteGoal, FinancialGoal } from "@/hooks/useFinancialData";
import { GoalForm } from "@/components/forms/GoalForm";
import { EditGoalForm } from "@/components/forms/EditGoalForm";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  const { formatCurrencyWithCurrency, groupByCurrency } = useCurrency();

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await deleteGoal.mutateAsync(goalToDelete.id);
      toast({
        title: "Goal deleted",
        description: `Goal "${goalToDelete.goal_name}" has been deleted.`,
      });
      setGoalToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals with currency grouping
  const goalsByCurrency = goals ? groupByCurrency(goals.map(goal => ({ 
    currency: goal.currency, 
    amount: Number(goal.target_amount) 
  }))) : {};

  const savedByCurrency = goals ? groupByCurrency(goals.map(goal => ({ 
    currency: goal.currency, 
    amount: Number(goal.current_amount || 0) 
  }))) : {};

  const totalValue = goals?.reduce((sum, goal) => sum + Number(goal.target_amount), 0) || 0;
  const allGoals = goals || [];

  if (showForm) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create New Goal</h1>
            <p className="text-muted-foreground">Set a new financial target</p>
          </div>
        </div>
        <GoalForm 
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
            <h1 className="text-3xl font-bold">Financial Goals</h1>
            <p className="text-muted-foreground">Set and track your financial objectives</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
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
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground">Set and track your financial objectives</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allGoals.length}</div>
            <Badge variant="secondary" className="mt-2">
              <Target className="w-3 h-3 mr-1" />
              In progress
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(goalsByCurrency).map(([currency, { total }]) => (
                <div key={currency} className="text-2xl font-bold">
                  {formatCurrencyWithCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(goalsByCurrency).length === 0 && (
                <div className="text-2xl font-bold">RWF 0</div>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Target amount
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(savedByCurrency).map(([currency, { total }]) => (
                <div key={currency} className="text-2xl font-bold">
                  {formatCurrencyWithCurrency(total, currency)}
                </div>
              ))}
              {Object.keys(savedByCurrency).length === 0 && (
                <div className="text-2xl font-bold">RWF 0</div>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              Current progress
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue > 0 
                ? Math.round((allGoals.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0) / totalValue) * 100)
                : 0}%
            </div>
            <Badge variant="secondary" className="mt-2">
              Overall completion
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>All Financial Goals</CardTitle>
          <CardDescription>Track your progress towards major purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {allGoals.length > 0 ? (
            <div className="space-y-6">
              {allGoals.map((goal) => {
                const progress = (Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100;
                const remaining = Number(goal.target_amount) - Number(goal.current_amount || 0);
                const daysUntilTarget = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={goal.id} className="p-6 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{goal.goal_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(goal.target_date).toLocaleDateString()}
                          </Badge>
                          <Badge variant="secondary">
                            {goal.priority} priority
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGoal(goal);
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
                              onClick={() => setGoalToDelete(goal)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{goal.goal_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <Progress value={progress} className="h-3 mb-4" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {formatCurrencyWithCurrency(Number(goal.current_amount || 0), goal.currency)} / {formatCurrencyWithCurrency(Number(goal.target_amount), goal.currency)}
                        </span>
                        <span className="font-medium text-primary">
                          {progress.toFixed(1)}% complete
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {remaining > 0 && (
                          <span className="text-muted-foreground">
                            {formatCurrencyWithCurrency(remaining, goal.currency)} remaining
                          </span>
                        )}
                        {daysUntilTarget > 0 ? (
                          <span className="text-muted-foreground">
                            {daysUntilTarget} days left
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
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
              No active goals yet. Create your first financial goal!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          {selectedGoal && (
            <EditGoalForm
              goal={selectedGoal}
              onClose={() => {
                setShowEditForm(false);
                setSelectedGoal(null);
              }}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedGoal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}