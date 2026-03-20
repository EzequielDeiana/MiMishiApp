import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PRESET_CATEGORIES, CUSTOM_CATEGORY_KEY, resolveCategory } from '../types/categories';
 
type Budget = {
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
 
type ModalMode = 'create' | 'edit';
 
export default function Budgets() {
  const { t } = useTranslation();
  const currentMonthKey = new Date().toISOString().slice(0, 7);
 
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
 
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BudgetForm>();
  const watchedCategory = watch('category');
  const isCustom = watchedCategory === CUSTOM_CATEGORY_KEY;
 
  const fetchBudgets = async () => {
    try {
      const res = await axios.get(`/api/budgets/progress?month=${currentMonthKey}`);
      setBudgets(res.data);
    } catch {
      toast.error(t('budgets.error_load'));
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => { fetchBudgets(); }, []);
 
  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    reset({ category: '', categoryCustom: '', amount: undefined, month: currentMonthKey });
    setShowModal(true);
  };
 
  const openEdit = (b: Budget) => {
    setModalMode('edit');
    setEditingId(b._id);
    const isPreset = PRESET_CATEGORIES.includes(b.category as typeof PRESET_CATEGORIES[number]);
    reset({
      category: isPreset ? b.category : CUSTOM_CATEGORY_KEY,
      categoryCustom: isPreset ? '' : b.category,
      amount: b.amount,
      month: b.month || '',
    });
    setShowModal(true);
  };
 
  const closeModal = () => { setShowModal(false); reset(); };
 
  const onSubmit = async (data: BudgetForm) => {
    const finalCategory = data.category === CUSTOM_CATEGORY_KEY
      ? data.categoryCustom?.trim()
      : data.category;
 
    const payload = {
      category: finalCategory || 'other',
      amount: data.amount,
      month: data.month || null,
    };
 
    try {
      if (modalMode === 'create') {
        await axios.post('/api/budgets', payload);
        toast.success(t('budgets.added'));
      } else {
        await axios.patch(`/api/budgets/${editingId}`, payload);
        toast.success(t('budgets.updated'));
      }
      closeModal();
      fetchBudgets();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      const msg = e.response?.data?.error || (modalMode === 'create' ? t('budgets.error_add') : t('budgets.error_update'));
      toast.error(msg);
    }
  };
 
  const handleDelete = async (id: string) => {
    if (!confirm(t('budgets.confirm_delete'))) return;
    try {
      await axios.delete(`/api/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b._id !== id));
      toast.success(t('budgets.deleted'));
    } catch {
      toast.error(t('budgets.error_delete'));
    }
  };
 
  const inputClass = `w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;
 
  if (loading) return (
    <div className="max-w-3xl mx-auto p-6">
      <Skeleton height={48} width={280} className="mb-10 mx-auto" />
      {[...Array(3)].map((_, i) => <Skeleton key={i} height={80} className="mb-4 rounded-2xl" />)}
    </div>
  );
 
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('budgets.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('budgets.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                     text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md text-sm"
        >
          {t('budgets.add')}
        </button>
      </div>
 
      {budgets.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-5xl mb-4">💰</p>
          <p className="text-lg">{t('budgets.no_budgets')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const remaining = b.amount - b.spent;
            return (
              <div
                key={b._id}
                className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border transition
                  ${b.exceeded
                    ? 'border-red-400 dark:border-red-500'
                    : b.percentage >= 80
                    ? 'border-orange-300 dark:border-orange-500'
                    : 'border-gray-200 dark:border-gray-700'}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {resolveCategory(b.category, t)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {b.month
                        ? b.month
                        : <span className="italic">{t('budgets.recurring')}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                    >
                      {t('budgets.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                    >
                      {t('budgets.delete')}
                    </button>
                  </div>
                </div>
 
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      b.exceeded ? 'bg-red-500' : b.percentage >= 80 ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
 
                {/* Números */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('budgets.spent')}: <strong className={b.exceeded ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}>
                      ${b.spent.toFixed(2)}
                    </strong>
                    <span className="text-gray-400 dark:text-gray-500"> / ${b.amount.toFixed(2)}</span>
                  </span>
                  <span className={`font-semibold ${
                    b.exceeded
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {b.exceeded
                      ? `+$${Math.abs(remaining).toFixed(2)} ${t('budgets.exceeded')}`
                      : `${t('budgets.remaining')}: $${remaining.toFixed(2)}`}
                  </span>
                </div>
 
                {/* Porcentaje badge */}
                <div className="mt-2 flex justify-end">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    b.exceeded
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : b.percentage >= 80
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {b.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            >×</button>
 
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
              {modalMode === 'create' ? t('budgets.modal_new') : t('budgets.modal_edit')}
            </h2>
 
            <form onSubmit={handleSubmit(onSubmit)}>
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
                  <input
                    type="text"
                    placeholder={t('modal.category_custom_placeholder')}
                    {...register('categoryCustom', { required: isCustom })}
                    autoFocus
                    className={inputClass + ' border-indigo-400 dark:border-indigo-500'}
                  />
                </div>
              )}
 
              {/* Monto */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  {t('budgets.field_amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
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
                <input
                  type="month"
                  {...register('month')}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {t('budgets.field_month_hint')}
                </p>
              </div>
 
              <div className="flex gap-4">
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition">
                  {t('budgets.save')}
                </button>
                <button type="button" onClick={closeModal}
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