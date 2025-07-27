import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Target, Trophy, Calendar, TrendingUp, AlertCircle, DollarSign, Edit, Trash2, Loader2 } from "lucide-react";
import { useGoals, FinancialGoal, useDeleteGoal } from "@/hooks/useFinancialData";
import { GoalForm } from "@/components/forms/GoalForm";
import { UpdateGoalForm } from "@/components/forms/UpdateGoalForm";
import { EditGoalForm } from "@/components/forms/EditGoalForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  if (selectedGoal) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Update Goal</h1>
            <p className="text-muted-foreground">Add or subtract money from your goal</p>
          </div>
        </div>
        <UpdateGoalForm 
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)} 
          onSuccess={() => setSelectedGoal(null)} 
        />
      </div>
    );
  }

  if (showEditForm && selectedGoal) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Edit Goal</h1>
            <p className="text-muted-foreground">Edit your financial goal details</p>
          </div>
        </div>
        <EditGoalForm 
          goal={selectedGoal}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedGoal(null);
            toast({
              title: "Goal updated",
              description: `Goal "${selectedGoal?.goal_name}" updated successfully.`,
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
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(allGoals.reduce((sum, goal) => sum + Number(goal.current_amount), 0))}</div>
            <Badge variant="secondary" className="mt-2">
              Current progress
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allGoals.filter(goal => goal.current_amount >= goal.target_amount).length}</div>
            <Badge variant="secondary" className="mt-2">
              <Trophy className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Goals
          </CardTitle>
          <CardDescription>Track progress towards your financial objectives</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-5 w-[100px]" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : allGoals.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals set yet</h3>
              <p className="text-muted-foreground mb-4">Create your first financial goal to start planning for the future</p>
              <Button onClick={() => setShowForm(true)}>Create Your First Goal</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {allGoals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const remaining = goal.target_amount - goal.current_amount;
                const targetDate = new Date(goal.target_date);
                const now = new Date();
                const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={goal.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{goal.goal_name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(goal.priority)} variant="secondary">
                          {goal.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {targetDate.toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    
                    <Progress value={Math.min(progress, 100)} className="h-3" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                        <span className="font-medium text-primary">
                          {progress.toFixed(1)}% complete
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {remaining > 0 && (
                          <span className="text-muted-foreground">
                            {formatCurrency(remaining)} remaining
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
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 text-xs"
                            onClick={() => setSelectedGoal(goal)}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setShowEditForm(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => setGoalToDelete(goal)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your goal and all associated progress.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setGoalToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteGoal} disabled={deleteGoal.isPending}>
                                  {deleteGoal.isPending ? (
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