import { createContext, useContext, useState, ReactNode } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const currencies: Currency[] = [
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF", locale: "en-RW" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatCurrencyWithCurrency: (amount: number, currencyCode: string) => string;
  getCurrencyByCode: (code: string) => Currency | undefined;
  groupByCurrency: <T extends { currency: string; amount: number }>(items: T[]) => Record<string, { items: T[]; total: number }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to RWF

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode 
      ? currencies.find(c => c.code === currencyCode) || selectedCurrency
      : selectedCurrency;
    
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyWithCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode) || currencies[0];
    
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencyByCode = (code: string): Currency | undefined => {
    return currencies.find(c => c.code === code);
  };

  const groupByCurrency = <T extends { currency: string; amount: number }>(items: T[]) => {
    const grouped: Record<string, { items: T[]; total: number }> = {};
    
    items.forEach(item => {
      if (!grouped[item.currency]) {
        grouped[item.currency] = { items: [], total: 0 };
      }
      grouped[item.currency].items.push(item);
      grouped[item.currency].total += item.amount;
    });
    
    return grouped;
  };

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setSelectedCurrency, 
      formatCurrency, 
      formatCurrencyWithCurrency,
      getCurrencyByCode,
      groupByCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 