import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIncomes, useTransactions } from "@/hooks/useFinancialData";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface ReportGeneratorProps {
  onClose: () => void;
}

export function ReportGenerator({ onClose }: ReportGeneratorProps) {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: incomes } = useIncomes();
  const { data: transactions } = useTransactions();
  const { toast } = useToast();
  const { formatCurrencyWithCurrency, groupByCurrency } = useCurrency();

  const generateReport = async () => {
    if (!incomes || !transactions) {
      toast({
        title: "Error",
        description: "Data not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Filter data by date range
      const filteredIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.received_date);
        return incomeDate >= new Date(startDate) && incomeDate <= new Date(endDate);
      });

      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
      });

      // Group by currency
      const incomesByCurrency = groupByCurrency(filteredIncomes.map(income => ({ 
        currency: income.currency, 
        amount: Number(income.amount) 
      })));

      const transactionsByCurrency = groupByCurrency(filteredTransactions.map(transaction => ({ 
        currency: transaction.currency, 
        amount: Number(transaction.amount) 
      })));

      // Calculate totals
      const totalIncome = filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
      const totalExpenses = filteredTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      const netIncome = totalIncome - totalExpenses;

      // Create report content
      let reportContent = `Financial Report\n`;
      reportContent += `Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}\n\n`;

      // Income breakdown by currency
      reportContent += `INCOME BREAKDOWN:\n`;
      Object.entries(incomesByCurrency).forEach(([currency, { total }]) => {
        reportContent += `${formatCurrencyWithCurrency(total, currency)}\n`;
      });
      reportContent += `\n`;

      // Expense breakdown by currency
      reportContent += `EXPENSE BREAKDOWN:\n`;
      Object.entries(transactionsByCurrency).forEach(([currency, { total }]) => {
        reportContent += `${formatCurrencyWithCurrency(total, currency)}\n`;
      });
      reportContent += `\n`;

      // Net income by currency
      reportContent += `NET INCOME:\n`;
      const allCurrencies = new Set([
        ...Object.keys(incomesByCurrency),
        ...Object.keys(transactionsByCurrency)
      ]);
      
      allCurrencies.forEach(currency => {
        const incomeTotal = incomesByCurrency[currency]?.total || 0;
        const expenseTotal = transactionsByCurrency[currency]?.total || 0;
        const net = incomeTotal - expenseTotal;
        reportContent += `${formatCurrencyWithCurrency(net, currency)}\n`;
      });

      // Top expense categories
      const categoryTotals: Record<string, number> = {};
      filteredTransactions.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(transaction.amount);
      });

      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      if (topCategories.length > 0) {
        reportContent += `\nTOP EXPENSE CATEGORIES:\n`;
        topCategories.forEach(([category, amount]) => {
          reportContent += `${category}: ${formatCurrencyWithCurrency(amount, 'RWF')}\n`;
        });
      }

      // Download report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Your financial report has been downloaded successfully.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Generate Financial Report</CardTitle>
        <CardDescription>Create a detailed report of your income and expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}