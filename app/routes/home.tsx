import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PRESET_CATEGORIES, CUSTOM_CATEGORY_KEY, resolveCategory } from '../types/categories';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthlySummary = { _id: string; ingresos: number; gastos: number };

type BudgetProgress = {
  _id: string;
  category: string;
  amount: number;
  month: string | null;
  spent: number;
  percentage: number;
  exceeded: boolean;
};

type BudgetForm = {
  category: string;
  categoryCustom: string;
  amount: number;
  month: string;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Estado global
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario de presupuesto
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BudgetForm>();
  const watchedCategory = watch('category');
  const isCustom = watchedCategory === CUSTOM_CATEGORY_KEY;

  // ─── Fetch inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, budgetsRes] = await Promise.all([
          axios.get('/api/transactions/summary'),
          axios.get(`/api/budgets/progress?month=${currentMonthKey}`),
        ]);
        setSummary(summaryRes.data);
        setBudgets(budgetsRes.data);
      } catch {
        setError(t('transactions.error_load'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Métricas del mes ───────────────────────────────────────────────────────

  const currentMonth = summary.find(s => s._id === currentMonthKey)
    ?? { ingresos: 0, gastos: 0 };
  const balance = currentMonth.ingresos - currentMonth.gastos;
  const daysElapsed = new Date().getDate();
  const dailyAvg = daysElapsed > 0 ? currentMonth.gastos / daysElapsed : 0;
  const bestMonth = summary.length > 0
    ? summary.reduce((best, s) =>
      (s.ingresos - s.gastos) > (best.ingresos - best.gastos) ? s : best
      , summary[0])
    : null;

  // ─── Gráfico ────────────────────────────────────────────────────────────────

  const chartData: ChartData<'bar'> = {
    labels: [...summary].reverse().map(s => s._id),
    datasets: [
      {
        label: t('home.income'),
        data: [...summary].reverse().map(s => s.ingresos || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.65)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: t('home.expenses'),
        data: [...summary].reverse().map(s => s.gastos || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.65)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: t('home.chart_title') },
    },
    scales: { y: { beginAtZero: true }, x: { ticks: { color: '#9ca3af' } } },
  };

  // ─── Handlers de presupuesto ────────────────────────────────────────────────

  const openCreateBudget = () => {
    setEditingBudget(null);
    reset({ category: '', categoryCustom: '', amount: undefined, month: currentMonthKey });
    setShowBudgetModal(true);
  };

  const openEditBudget = (b: BudgetProgress) => {
    setEditingBudget(b);
    const isPreset = PRESET_CATEGORIES.includes(b.category as typeof PRESET_CATEGORIES[number]);
    reset({
      category: isPreset ? b.category : CUSTOM_CATEGORY_KEY,
      categoryCustom: isPreset ? '' : b.category,
      amount: b.amount,
      month: b.month || '',
    });
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => { setShowBudgetModal(false); reset(); setEditingBudget(null); };

  const onBudgetSubmit = async (data: BudgetForm) => {
    const finalCategory = data.category === CUSTOM_CATEGORY_KEY
      ? data.categoryCustom?.trim() || 'other'
      : data.category;

    const payload = { category: finalCategory, amount: data.amount, month: data.month || null };

    try {
      if (editingBudget) {
        await axios.patch(`/api/budgets/${editingBudget._id}`, payload);
        toast.success(t('budgets.updated'));
      } else {
        await axios.post('/api/budgets', payload);
        toast.success(t('budgets.added'));
      }
      closeBudgetModal();
      // Refrescar presupuestos
      const res = await axios.get(`/api/budgets/progress?month=${currentMonthKey}`);
      setBudgets(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || t('budgets.error_add'));
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm(t('budgets.confirm_delete'))) return;
    try {
      await axios.delete(`/api/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b._id !== id));
      toast.success(t('budgets.deleted'));
    } catch {
      toast.error(t('budgets.error_delete'));
    }
  };

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <Skeleton height={40} width={320} className="mb-10 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <Skeleton height={20} width={120} className="mx-auto mb-3" />
            <Skeleton height={36} width={160} className="mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} height={90} className="rounded-xl" />)}
      </div>
      <Skeleton height={200} className="rounded-2xl mb-6" />
      <Skeleton height={420} className="rounded-2xl" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16 text-red-600 dark:text-red-400 text-xl">{error}</div>
  );

  const inputClass = `w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;

  return (
    <div className="w-full max-w-5xl mx-auto p-6">

      {/* Bienvenida */}
      <h1 className="text-3xl font-bold mb-10 text-gray-800 dark:text-gray-100 text-center md:text-left">
        {t('home.welcome', { name: user?.username || 'Usuario' })}
      </h1>

      {/* ─── Resumen del mes ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-pink-500 dark:border-pink-300 mb-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">{t('home.summary')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">{t('home.income')}</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${currentMonth.ingresos.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">{t('home.expenses')}</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${currentMonth.gastos.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">{t('home.balance')}</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Métricas adicionales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('home.daily_avg')}</p>
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">${dailyAvg.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('home.best_month')}</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {bestMonth ? bestMonth._id : t('home.no_data')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow border border-gray-200 dark:border-gray-700 text-center col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('home.active_months')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.length} <span className="text-sm font-normal text-gray-500">{t('home.months_label')}</span>
          </p>
        </div>
      </div>


      {/* ─── Sección de presupuestos ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('budgets.title')}</h2>
          <button
            onClick={openCreateBudget}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                       text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {t('budgets.add')}
          </button>
        </div>

        {budgets.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('budgets.no_budgets')}</p>
        ) : (
          <div className="space-y-5">
            {budgets.map(b => {
              const remaining = b.amount - b.spent;
              return (
                <div key={b._id}>
                  {/* Header fila */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {resolveCategory(b.category, t)}
                      </span>
                      {!b.month && (
                        <span className="text-xs italic text-gray-400 dark:text-gray-500">
                          ({t('budgets.recurring')})
                        </span>
                      )}
                      {b.exceeded && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                          {t('budgets.exceeded')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className={b.exceeded ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}>
                          ${b.spent.toFixed(2)}
                        </strong>
                        {' '}{t('budgets.of')}{' '}
                        ${b.amount.toFixed(2)}
                      </span>
                      <button onClick={() => openEditBudget(b)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        {t('budgets.edit')}
                      </button>
                      <button onClick={() => handleDeleteBudget(b._id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline">
                        {t('budgets.delete')}
                      </button>
                    </div>
                  </div>

                  {/* Barra */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${b.exceeded ? 'bg-red-500' : b.percentage >= 80 ? 'bg-orange-400' : 'bg-green-500'
                        }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Restante */}
                  <p className={`text-xs mt-1 text-right font-medium ${b.exceeded ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {b.exceeded
                      ? `+$${Math.abs(remaining).toFixed(2)} sobre el límite`
                      : `${t('budgets.remaining')}: $${remaining.toFixed(2)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Gráfico ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-blue-400 dark:border-blue-300">
        {summary.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-16 text-lg">
            {t('home.no_transactions')}
          </p>
        ) : (
          <div className="h-[420px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* ─── Modal de presupuesto ──────────────────────────────────────────────── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={closeBudgetModal}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none">
              ×
            </button>

            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
              {editingBudget ? t('budgets.modal_edit') : t('budgets.modal_new')}
            </h2>

            <form onSubmit={handleSubmit(onBudgetSubmit)}>
              {/* Categoría */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  {t('budgets.field_category')}
                </label>
                <select {...register('category', { required: true })} className={inputClass}>
                  <option value="">{t('categories.select')}</option>
                  {PRESET_CATEGORIES.map(k => (
                    <option key={k} value={k}>{t(`categories.${k}`)}</option>
                  ))}
                  <option value={CUSTOM_CATEGORY_KEY}>{t('categories.custom')}</option>
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{t('validation.required_field')}</p>}
              </div>

              {isCustom && (
                <div className="mb-4">
                  <input type="text" autoFocus
                    placeholder={t('modal.category_custom_placeholder')}
                    {...register('categoryCustom', { required: isCustom })}
                    className={inputClass + ' border-indigo-400 dark:border-indigo-500'}
                  />
                </div>
              )}

              {/* Monto */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  {t('budgets.field_amount')}
                </label>
                <input type="number" step="0.01"
                  {...register('amount', { required: true, min: 0.01 })}
                  className={inputClass}
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{t('validation.required_value')}</p>}
              </div>

              {/* Mes */}
              <div className="mb-8">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  {t('budgets.field_month')}
                </label>
                <input type="month" {...register('month')} className={inputClass} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {t('budgets.field_month_hint')}
                </p>
              </div>

              <div className="flex gap-4">
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition">
                  {t('budgets.save')}
                </button>
                <button type="button" onClick={closeBudgetModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium transition">
                  {t('budgets.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}