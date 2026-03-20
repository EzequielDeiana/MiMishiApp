import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { PRESET_CATEGORIES, CUSTOM_CATEGORY_KEY, resolveCategory } from '../types/categories';

const PAGE_SIZE = 10;

type Transaccion = {
  _id: string;
  type: 'ingreso' | 'gasto';
  title: string;
  description: string;
  category: string;
  value: number;
  date: string;
};

type TransaccionForm = {
  type: 'ingreso' | 'gasto';
  title: string;
  description: string;
  categoryKey: string;
  categoryCustom: string;
  value: number;
};

type Filters = {
  type: '' | 'ingreso' | 'gasto';
  category: string;
  dateFrom: string;
  dateTo: string;
};

type ModalMode = 'create' | 'edit';

const toCategoryKey = (saved: string) => {
  if (!saved || PRESET_CATEGORIES.includes(saved as typeof PRESET_CATEGORIES[number])) {
    return { key: saved || '', custom: '' };
  }
  return { key: CUSTOM_CATEGORY_KEY, custom: saved };
};

// ─── Paginador ────────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, total, onPage,
}: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  // Mostrar máximo 5 páginas alrededor de la actual
  const range: number[] = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    range.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 px-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('transactions.showing')} {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} {t('transactions.page_of')} {total} {t('transactions.results')}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onPage(1)} disabled={page === 1}
          className="px-2 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300">
          «
        </button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="px-2 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300">
          ‹
        </button>
        {range[0] > 1 && <span className="px-2 py-1 text-sm text-gray-400">…</span>}
        {range.map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={`px-3 py-1 rounded text-sm border transition ${
              p === page
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {p}
          </button>
        ))}
        {range[range.length - 1] < totalPages && <span className="px-2 py-1 text-sm text-gray-400">…</span>}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="px-2 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300">
          ›
        </button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages}
          className="px-2 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300">
          »
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Transactions() {
  const { t } = useTranslation();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({ type: '', category: '', dateFrom: '', dateTo: '' });
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransaccionForm>();
  const watchedCategoryKey = watch('categoryKey');
  const isCustomCategory = watchedCategoryKey === CUSTOM_CATEGORY_KEY;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/transactions');
        setTransacciones(res.data);
      } catch {
        setError(t('transactions.error_load'));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => { setIncomePage(1); setExpensePage(1); }, [filters]);

  // Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    reset({ type: undefined, title: '', description: '', categoryKey: '', categoryCustom: '', value: undefined });
    setShowForm(true);
  };

  const openEditModal = (tx: Transaccion) => {
    setModalMode('edit');
    setEditingId(tx._id);
    const { key, custom } = toCategoryKey(tx.category);
    reset({ type: tx.type, title: tx.title, description: tx.description, categoryKey: key, categoryCustom: custom, value: tx.value });
    setShowForm(true);
  };

  const closeModal = () => { setShowForm(false); setEditingId(null); reset(); };

  const resolveSubmitCategory = (data: TransaccionForm) => {
    if (data.categoryKey === CUSTOM_CATEGORY_KEY) return data.categoryCustom?.trim() || 'other';
    return data.categoryKey || 'other';
  };

  const onSubmit = async (data: TransaccionForm) => {
    const payload = { type: data.type, title: data.title, description: data.description, category: resolveSubmitCategory(data), value: data.value };
    if (modalMode === 'create') {
      try {
        const res = await axios.post('/api/transactions', payload);
        setTransacciones(prev => [res.data.transaction, ...prev]);
        toast.success(t('transactions.added'));
        closeModal();
      } catch { toast.error(t('transactions.error_add')); }
    } else {
      try {
        const res = await axios.patch(`/api/transactions/${editingId}`, payload);
        setTransacciones(prev => prev.map(tx => tx._id === editingId ? res.data.transaction : tx));
        toast.success(t('transactions.updated'));
        closeModal();
      } catch { toast.error(t('transactions.error_update')); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('transactions.confirm_delete'))) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      setTransacciones(prev => prev.filter(tx => tx._id !== id));
      toast.success(t('transactions.deleted'));
    } catch { toast.error(t('transactions.error_delete')); }
  };

  const hasActiveFilters = filters.type || filters.category || filters.dateFrom || filters.dateTo;
  const activeCount = [filters.type, filters.category, filters.dateFrom, filters.dateTo].filter(Boolean).length;

  const clearFilters = () => setFilters({ type: '', category: '', dateFrom: '', dateTo: '' });

  // Filtrado
  const allFiltered = useMemo(() => transacciones.filter(tx => {
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.category && tx.category !== filters.category) return false;
    if (filters.dateFrom && new Date(tx.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo) {
      const to = new Date(filters.dateTo); to.setDate(to.getDate() + 1);
      if (new Date(tx.date) >= to) return false;
    }
    return true;
  }), [transacciones, filters]);

  const ingresos = useMemo(() => allFiltered.filter(tx => tx.type === 'ingreso'), [allFiltered]);
  const gastos = useMemo(() => allFiltered.filter(tx => tx.type === 'gasto'), [allFiltered]);

  const paginate = (list: Transaccion[], page: number) => ({
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    totalPages: Math.max(1, Math.ceil(list.length / PAGE_SIZE)),
    total: list.length,
  });

  const incomeData = paginate(ingresos, incomePage);
  const expenseData = paginate(gastos, expensePage);

  if (loading) return (
    <div className="max-w-7xl mx-auto p-6">
      <Skeleton height={48} className="mb-10 mx-auto" />
      <div className="flex gap-6">
        <Skeleton width={220} height={400} className="rounded-2xl flex-shrink-0" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => <div key={i}><Skeleton height={32} width={180} className="mb-6" /><Skeleton count={5} height={56} className="mb-2 rounded-lg" /></div>)}
        </div>
      </div>
    </div>
  );

  const selectClass = `w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
    focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition`;

  const TransactionTable = ({ items, colorClass }: { items: Transaccion[]; colorClass: string }) => (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full min-w-[520px] border-collapse bg-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700/80">
            {[t('transactions.col_title'), t('transactions.col_category'), t('transactions.col_value'), t('transactions.col_date'), t('transactions.col_actions')].map(h => (
              <th key={h} className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 text-sm">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(tx => (
            <tr key={tx._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="p-3">
                <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{tx.title}</p>
                {tx.description && <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{tx.description}</p>}
              </td>
              <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{tx.category ? resolveCategory(tx.category, t) : '—'}</td>
              <td className={`p-3 font-medium text-sm ${colorClass}`}>${tx.value.toFixed(2)}</td>
              <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{new Date(tx.date).toLocaleDateString('es-AR')}</td>
              <td className="p-3">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEditModal(tx)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition">
                    {t('transactions.edit')}
                  </button>
                  <button onClick={() => handleDelete(tx._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition">
                    {t('transactions.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('transactions.title')}</h1>
        <button onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-md">
          {t('transactions.add')}
        </button>
      </div>

      {/* ─── Layout: sidebar + contenido ─────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Sidebar de filtros — fijo en desktop, colapsable en mobile */}
        <aside className="hidden lg:block w-56 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-5 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t('transactions.filters')}
            </h3>
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {t('transactions.filter_type')}
              </label>
              <select value={filters.type}
                onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))}
                className={selectClass}>
                <option value="">{t('transactions.filter_all')}</option>
                <option value="ingreso">{t('modal.type_income')}</option>
                <option value="gasto">{t('modal.type_expense')}</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {t('transactions.filter_category')}
              </label>
              <select value={filters.category}
                onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className={selectClass}>
                <option value="">{t('transactions.filter_all')}</option>
                {PRESET_CATEGORIES.map(k => (
                  <option key={k} value={k}>{t(`categories.${k}`)}</option>
                ))}
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {t('transactions.filter_date_from')}
              </label>
              <input type="date" value={filters.dateFrom}
                onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className={selectClass} />
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {t('transactions.filter_date_to')}
              </label>
              <input type="date" value={filters.dateTo}
                onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className={selectClass} />
            </div>

            {/* Limpiar */}
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="w-full text-sm text-red-600 dark:text-red-400 hover:underline font-medium pt-1">
                {t('transactions.filter_clear')}
              </button>
            )}
          </div>
        </aside>

        {/* Filtros mobile — dropdown compacto */}
        <div className="lg:hidden w-full mb-4">
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
            <summary className="p-4 font-semibold text-gray-800 dark:text-gray-100 cursor-pointer flex items-center justify-between">
              <span>{t('transactions.filters')}</span>
              {hasActiveFilters && (
                <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </summary>
            <div className="p-4 pt-0 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-700">
              <select value={filters.type} onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))} className={selectClass}>
                <option value="">{t('transactions.filter_all')}</option>
                <option value="ingreso">{t('modal.type_income')}</option>
                <option value="gasto">{t('modal.type_expense')}</option>
              </select>
              <select value={filters.category} onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))} className={selectClass}>
                <option value="">{t('transactions.filter_all')}</option>
                {PRESET_CATEGORIES.map(k => <option key={k} value={k}>{t(`categories.${k}`)}</option>)}
              </select>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className={selectClass} placeholder={t('transactions.filter_date_from')} />
              <input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} className={selectClass} placeholder={t('transactions.filter_date_to')} />
              {hasActiveFilters && (
                <button onClick={clearFilters} className="col-span-2 text-sm text-red-600 dark:text-red-400 hover:underline font-medium text-center pt-1">
                  {t('transactions.filter_clear')}
                </button>
              )}
            </div>
          </details>
        </div>

        {/* Tablas */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">{t('transactions.income')}</h2>
            {ingresos.length === 0
              ? <p className="text-gray-600 dark:text-gray-400 py-8 text-center text-sm">{t('transactions.no_income')}</p>
              : <>
                  <TransactionTable items={incomeData.items} colorClass="text-green-600 dark:text-green-400" />
                  <Pagination page={incomePage} totalPages={incomeData.totalPages} total={incomeData.total} onPage={setIncomePage} />
                </>}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-red-700 dark:text-red-400">{t('transactions.expenses')}</h2>
            {gastos.length === 0
              ? <p className="text-gray-600 dark:text-gray-400 py-8 text-center text-sm">{t('transactions.no_expenses')}</p>
              : <>
                  <TransactionTable items={expenseData.items} colorClass="text-red-600 dark:text-red-400" />
                  <Pagination page={expensePage} totalPages={expenseData.totalPages} total={expenseData.total} onPage={setExpensePage} />
                </>}
          </section>
        </div>
      </div>

      {/* ─── Modal ────────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none">×</button>

            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
              {modalMode === 'create' ? t('modal.new') : t('modal.edit')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-5">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">{t('modal.type')}</label>
                <select {...register('type', { required: t('validation.required_type') })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">
                  <option value="">{t('modal.type_select')}</option>
                  <option value="ingreso">{t('modal.type_income')}</option>
                  <option value="gasto">{t('modal.type_expense')}</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1.5">{errors.type.message}</p>}
              </div>
              <div className="mb-5">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">{t('modal.field_title')}</label>
                <input type="text" {...register('title', { required: t('validation.required_title') })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
                {errors.title && <p className="text-red-500 text-sm mt-1.5">{errors.title.message}</p>}
              </div>
              <div className="mb-5">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  {t('modal.desc')} <span className="text-gray-400 font-normal">{t('modal.desc_optional')}</span>
                </label>
                <input type="text" {...register('description')}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">{t('modal.category')}</label>
                <select {...register('categoryKey')}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">
                  <option value="">{t('categories.select')}</option>
                  {PRESET_CATEGORIES.map(k => <option key={k} value={k}>{t(`categories.${k}`)}</option>)}
                  <option value={CUSTOM_CATEGORY_KEY}>{t('categories.custom')}</option>
                </select>
              </div>
              {isCustomCategory && (
                <div className="mb-5">
                  <input type="text" placeholder={t('modal.category_custom_placeholder')} autoFocus
                    {...register('categoryCustom', { required: isCustomCategory ? t('validation.required_title') : false })}
                    className="w-full p-3.5 border border-indigo-400 dark:border-indigo-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
                  {errors.categoryCustom && <p className="text-red-500 text-sm mt-1.5">{errors.categoryCustom.message}</p>}
                </div>
              )}
              <div className="mb-8">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">{t('modal.value')}</label>
                <input type="number" step="0.01"
                  {...register('value', { required: t('validation.required_value'), min: { value: 0.01, message: t('validation.min_value') } })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30" />
                {errors.value && <p className="text-red-500 text-sm mt-1.5">{errors.value.message}</p>}
              </div>
              <div className="flex gap-4">
                <button type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
                  {modalMode === 'create' ? t('modal.add') : t('modal.save')}
                </button>
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium transition">
                  {t('modal.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 dark:text-red-400 text-center mt-10 text-lg font-medium">{error}</p>}
    </div>
  );
}