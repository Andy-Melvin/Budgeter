import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIncomes, useTransactions } from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isWithinInterval } from "date-fns";
import { FileText, Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      // Filter data by date range
      const filteredIncomes = incomes.filter(income => 
        isWithinInterval(parseISO(income.received_date), { start, end })
      );
      
      const filteredExpenses = transactions.filter(transaction => 
        transaction.transaction_type === 'expense' &&
        isWithinInterval(parseISO(transaction.transaction_date), { start, end })
      );

      // Calculate totals
      const totalEarnings = filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netAmount = totalEarnings - totalExpenses;

      // Create PDF
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.text('Financial Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Period: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`, 20, 45);
      pdf.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 55);

      // Summary
      pdf.setFontSize(16);
      pdf.text('Summary', 20, 75);
      
      pdf.setFontSize(12);
      pdf.text(`Total Earnings: ${formatCurrency(totalEarnings)}`, 20, 90);
      pdf.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, 100);
      pdf.text(`Net Amount: ${formatCurrency(netAmount)}`, 20, 110);

      // Initialize yPos for content positioning
      let yPos = 130;

      // Earnings Detail
      if (filteredIncomes.length > 0) {
        pdf.setFontSize(16);
        pdf.text('Earnings Details', 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(10);
        
        filteredIncomes.forEach(income => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.text(`${format(parseISO(income.received_date), 'MMM dd')} - ${income.description}`, 20, yPos);
          pdf.text(`${formatCurrency(Number(income.amount))}`, 150, yPos);
          pdf.text(`${income.source_location}`, 110, yPos);
          yPos += 10;
        });
        
        yPos += 10;
      }

      // Expenses Detail
      if (filteredExpenses.length > 0) {
        if (yPos > 200) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(16);
        pdf.text('Expenses Details', 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(10);
        
        // Group expenses by category
        const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
          const category = expense.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(expense);
          return acc;
        }, {} as Record<string, typeof filteredExpenses>);

        Object.entries(expensesByCategory).forEach(([category, expenses]) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFontSize(12);
          pdf.text(`${category}:`, 20, yPos);
          yPos += 8;
          
          pdf.setFontSize(10);
          const categoryTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          
          expenses.forEach(expense => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.text(`  ${format(parseISO(expense.transaction_date), 'MMM dd')} - ${expense.description}`, 25, yPos);
            pdf.text(`${formatCurrency(Number(expense.amount))}`, 150, yPos);
            if (expense.source_location) {
              pdf.text(`${expense.source_location}`, 110, yPos);
            }
            yPos += 8;
          });
          
          pdf.setFontSize(11);
          pdf.text(`Category Total: ${formatCurrency(categoryTotal)}`, 25, yPos);
          yPos += 15;
        });
      }

      // Save the PDF
      const fileName = `financial-report-${format(start, 'yyyy-MM')}-${format(end, 'yyyy-MM')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Report Generated",
        description: `Financial report for ${format(start, 'MMM yyyy')} to ${format(end, 'MMM yyyy')} has been downloaded.`,
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
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Financial Report
        </CardTitle>
        <CardDescription>
          Generate a PDF report of your earnings and expenses for a specific period
        </CardDescription>
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

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={generateReport} 
            disabled={isGenerating} 
            className="flex-1 gap-2"
          >
            {isGenerating ? (
              <>
                <Calendar className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}