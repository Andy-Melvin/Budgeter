import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  PlusCircle, 
  Target, 
  Wallet, 
  TrendingUp, 
  PiggyBank,
  CreditCard,
  Smartphone,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import { useIncomes, useAssets, useGoals, useBudgetCategories, useTransactions, useProfile, useCurrentEarnings, useDeleteIncome, IncomeSource } from "@/hooks/useFinancialData";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { EditIncomeForm } from "@/components/forms/EditIncomeForm";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Dashboard() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  // State for edit/delete functionality
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeSource | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeSource | null>(null);
  
  // Fetch real data
  const { data: incomes, isLoading: incomesLoading } = useIncomes();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: budgetCategories, isLoading: budgetLoading } = useBudgetCategories(currentMonth);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: profile } = useProfile();
  const { data: currentEarnings } = useCurrentEarnings();
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

  // Calculate totals
  const totalAssets = assets?.reduce((sum, asset) => sum + Number(asset.current_value), 0) || 0;
  const currentMonthIncome = incomes?.filter(income => 
    format(new Date(income.received_date), 'yyyy-MM') === currentMonth
  ).reduce((sum, income) => sum + Number(income.amount), 0) || 0;
  
  const totalBudgeted = budgetCategories?.reduce((sum, cat) => sum + Number(cat.budgeted_amount), 0) || 0;
  const totalSpent = budgetCategories?.reduce((sum, cat) => sum + Number(cat.spent_amount || 0), 0) || 0;
  const allGoals = goals || [];

  // Prepare chart data
  const assetChartData = assets?.reduce((acc, asset) => {
    const existing = acc.find(item => item.name === asset.asset_type);
    if (existing) {
      existing.value += Number(asset.current_value);
    } else {
      acc.push({
        name: asset.asset_type,
        value: Number(asset.current_value)
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Get last 6 months of income data
  const incomeChartData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthName = format(monthDate, 'MMM');
    
    const monthIncome = incomes?.filter(income => 
      format(new Date(income.received_date), 'yyyy-MM') === monthKey
    ).reduce((sum, income) => sum + Number(income.amount), 0) || 0;
    
    return {
      month: monthName,
      amount: monthIncome
    };
  });

  const recentIncomes = incomes?.slice(0, 5) || [];

  if (incomesLoading || assetsLoading || goalsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your income, manage goals, and control your budget
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="financial" className="gap-2" onClick={() => window.location.href = '/income'}>
            <PlusCircle className="w-4 h-4" />
            Add Earnings
          </Button>
          <Button variant="success" className="gap-2" onClick={() => window.location.href = '/goals'}>
            <Target className="w-4 h-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-muted/20 shadow-card hover:shadow-medium transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              <PiggyBank className="w-4 h-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalAssets)}</div>
            <Badge variant="secondary" className="mt-2 bg-success/10 text-success">
              <TrendingUp className="w-3 h-3 mr-1" />
              {assets?.length || 0} assets
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 shadow-card hover:shadow-medium transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Earnings</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(currentEarnings || 0)}</div>
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              Available Now
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 shadow-card hover:shadow-medium transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Status</CardTitle>
              <Target className="w-4 h-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0}%
            </div>
            <Badge variant="secondary" className="mt-2 bg-warning/10 text-warning">
              {formatCurrency(totalBudgeted - totalSpent)} remaining
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/20 shadow-card hover:shadow-medium transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
              <MapPin className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{allGoals.length}</div>
            <Badge variant="secondary" className="mt-2 bg-destructive/10 text-destructive">
              Total: {formatCurrency(allGoals.reduce((sum, goal) => sum + Number(goal.target_amount), 0))}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Asset Distribution
            </CardTitle>
            <CardDescription>Where your money is stored</CardDescription>
          </CardHeader>
          <CardContent>
            {assetChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No assets added yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Trend */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Earnings Trend
            </CardTitle>
            <CardDescription>Monthly earnings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Goals */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Financial Goals
            </CardTitle>
            <CardDescription>Track your progress towards major purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allGoals.length > 0 ? (
              allGoals.map((goal) => {
                const progress = (Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100;
                const remaining = Number(goal.target_amount) - Number(goal.current_amount || 0);
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{goal.goal_name}</h4>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(goal.target_date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(Number(goal.current_amount || 0))} / {formatCurrency(Number(goal.target_amount))}</span>
                      <span>{formatCurrency(remaining)} remaining</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No active goals yet. Create your first financial goal!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              Monthly Budget
            </CardTitle>
            <CardDescription>Track spending vs budget by category</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetCategories && budgetCategories.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetCategories.map(cat => ({
                    name: cat.category_name,
                    budgeted: Number(cat.budgeted_amount),
                    spent: Number(cat.spent_amount || 0)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="budgeted" fill="hsl(var(--muted))" name="Budgeted" />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No budget categories for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Income */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Earnings
          </CardTitle>
          <CardDescription>Latest earnings entries with source tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {recentIncomes.length > 0 ? (
            <div className="space-y-4">
              {recentIncomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <div>
                      <p className="font-medium">{income.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {income.source_location} • {new Date(income.received_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-bold text-success">+{formatCurrency(Number(income.amount))}</p>
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
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No earnings entries yet. Add your first earnings!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Income Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-md">
          {selectedIncome && (
            <EditIncomeForm 
              income={selectedIncome}
              onClose={() => setShowEditForm(false)}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedIncome(null);
                toast({
                  title: "Income updated",
                  description: `Income "${selectedIncome?.description}" updated successfully.`,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}