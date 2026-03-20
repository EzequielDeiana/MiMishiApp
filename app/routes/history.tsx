import { useEffect, useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { resolveCategory } from '../types/categories';
 
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
 
type Transaccion = {
  _id: string;
  type: 'ingreso' | 'gasto';
  title: string;
  description: string;
  category: string;
  value: number;
  date: string;
};
 
export default function History() {
  const { t } = useTranslation();
 
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
 
  const [allTransactions, setAllTransactions] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
 
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get('/api/transactions');
        setAllTransactions(res.data);
      } catch {
        setError(t('transactions.error_load'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);
 
  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return [];
    const count = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);
 
  const handleYearChange = (val: string) => {
    setSelectedYear(Number(val));
    setSelectedMonth(null);
    setSelectedDay(null);
  };
 
  const handleMonthChange = (val: string) => {
    setSelectedMonth(val === '' ? null : Number(val));
    setSelectedDay(null);
  };
 
  const filtered = useMemo(() => {
    return allTransactions.filter(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() !== selectedYear) return false;
      if (selectedMonth !== null && d.getMonth() + 1 !== selectedMonth) return false;
      if (selectedDay !== null && d.getDate() !== selectedDay) return false;
      return true;
    });
  }, [allTransactions, selectedYear, selectedMonth, selectedDay]);
 
  const chartData: ChartData<'bar'> = useMemo(() => {
    let labels: string[] = [];
    let incomeSeries: number[] = [];
    let expenseSeries: number[] = [];
 
    if (selectedDay !== null && selectedMonth !== null) {
      // Vista por día: agrupar por hora
      labels = Array.from({ length: 24 }, (_, h) => `${h}:00`);
      incomeSeries = labels.map((_, h) =>
        filtered.filter(tx => new Date(tx.date).getHours() === h && tx.type === 'ingreso')
          .reduce((s, tx) => s + tx.value, 0));
      expenseSeries = labels.map((_, h) =>
        filtered.filter(tx => new Date(tx.date).getHours() === h && tx.type === 'gasto')
          .reduce((s, tx) => s + tx.value, 0));
    } else if (selectedMonth !== null) {
      // Vista por mes: agrupar por día del mes
      const days = daysInMonth.length ? daysInMonth : Array.from({ length: 31 }, (_, i) => i + 1);
      labels = days.map(String);
      incomeSeries = days.map(d =>
        filtered.filter(tx => new Date(tx.date).getDate() === d && tx.type === 'ingreso')
          .reduce((s, tx) => s + tx.value, 0));
      expenseSeries = days.map(d =>
        filtered.filter(tx => new Date(tx.date).getDate() === d && tx.type === 'gasto')
          .reduce((s, tx) => s + tx.value, 0));
    } else {
      // Vista por año: agrupar por mes
      labels = Array.from({ length: 12 }, (_, i) =>
        t(`months.${i + 1}`).slice(0, 3));
      incomeSeries = Array.from({ length: 12 }, (_, i) =>
        filtered.filter(tx => new Date(tx.date).getMonth() === i && tx.type === 'ingreso')
          .reduce((s, tx) => s + tx.value, 0));
      expenseSeries = Array.from({ length: 12 }, (_, i) =>
        filtered.filter(tx => new Date(tx.date).getMonth() === i && tx.type === 'gasto')
          .reduce((s, tx) => s + tx.value, 0));
    }
 
    return {
      labels,
      datasets: [
        { label: t('history.income'), data: incomeSeries, backgroundColor: 'rgba(34, 197, 94, 0.65)', borderColor: 'rgba(34, 197, 94, 1)', borderWidth: 1 },
        { label: t('history.expenses'), data: expenseSeries, backgroundColor: 'rgba(239, 68, 68, 0.65)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 },
      ],
    };
  }, [filtered, selectedMonth, selectedDay, daysInMonth, t]);
 
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: t('history.chart_title') },
    },
    scales: { y: { beginAtZero: true }, x: { ticks: { color: '#9ca3af' } } },
  };
 
  const totalIncome = filtered.filter(tx => tx.type === 'ingreso').reduce((s, tx) => s + tx.value, 0);
  const totalExpenses = filtered.filter(tx => tx.type === 'gasto').reduce((s, tx) => s + tx.value, 0);
  const balance = totalIncome - totalExpenses;
 
  // Etiqueta del período usando las interpolaciones de i18next
  const periodLabel = useMemo(() => {
    const monthName = selectedMonth ? t(`months.${selectedMonth}`) : '';
    if (selectedDay !== null && selectedMonth !== null) {
      return t('history.period_day', { day: selectedDay, month: monthName, year: selectedYear });
    }
    if (selectedMonth !== null) {
      return t('history.period_month', { month: monthName, year: selectedYear });
    }
    return t('history.period_year', { year: selectedYear });
  }, [selectedYear, selectedMonth, selectedDay, t]);
 
  const selectClass = `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
    disabled:opacity-40 disabled:cursor-not-allowed`;
 
  if (loading) return (
    <div className="max-w-5xl mx-auto p-6">
      <Skeleton height={48} width={320} className="mb-10 mx-auto" />
      <Skeleton height={80} className="mb-8 rounded-2xl" />
      <Skeleton height={120} className="mb-8 rounded-2xl" />
      <Skeleton height={420} className="rounded-2xl" />
    </div>
  );
 
  if (error) return (
    <div className="text-center py-16 text-red-600 dark:text-red-400 text-xl">{error}</div>
  );
 
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800 dark:text-gray-100">
        {t('history.title')}
      </h1>
 
      {/* Selectores */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('history.year')}</label>
            <select value={selectedYear} onChange={e => handleYearChange(e.target.value)} className={selectClass}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('history.month')}</label>
            <select value={selectedMonth ?? ''} onChange={e => handleMonthChange(e.target.value)} className={selectClass}>
              <option value="">{t('history.all_months')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{t(`months.${m}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('history.day')}</label>
            <select
              value={selectedDay ?? ''}
              onChange={e => setSelectedDay(e.target.value === '' ? null : Number(e.target.value))}
              disabled={selectedMonth === null}
              className={selectClass}
            >
              <option value="">{t('history.all_days')}</option>
              {daysInMonth.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 font-medium">{periodLabel}</p>
      </div>
 
      {/* Resumen numérico */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-pink-500 dark:border-pink-300 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('history.income')}</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('history.expenses')}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('history.balance')}</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
 
      {/* Gráfico */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-blue-400 dark:border-blue-300 mb-8">
        {filtered.length === 0
          ? <p className="text-center text-gray-600 dark:text-gray-400 py-16 text-lg">{t('history.no_data')}</p>
          : <div className="h-[380px]"><Bar data={chartData} options={chartOptions} /></div>}
      </div>
 
      {/* Lista de transacciones del período */}
      {filtered.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/80">
                  {[t('transactions.col_date'), t('transactions.col_title'), t('transactions.col_category'), t('modal.type'), t('transactions.col_value')].map(h => (
                    <th key={h} className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(tx.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-gray-100">{tx.title}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {tx.category ? resolveCategory(tx.category, t) : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        tx.type === 'ingreso'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {tx.type === 'ingreso' ? t('modal.type_income') : t('modal.type_expense')}
                      </span>
                    </td>
                    <td className={`p-4 font-medium ${tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${tx.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}