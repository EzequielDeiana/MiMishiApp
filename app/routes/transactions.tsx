import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
 
type Transaccion = {
  _id: string;
  type: 'ingreso' | 'gasto';
  title: string;
  description: string;
  value: number;
  date: string;
};
 
type TransaccionForm = {
  type: 'ingreso' | 'gasto';
  title: string;
  description: string;
  value: number;
};
 
type ModalMode = 'create' | 'edit';
 
export default function Transactions() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  // ✅ Estado unificado para modal — maneja tanto crear como editar
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
 
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransaccionForm>();
 
  useEffect(() => {
    const fetchTransacciones = async () => {
      try {
        const res = await axios.get('/api/transactions');
        setTransacciones(res.data);
      } catch {
        setError('Error cargando transacciones');
      } finally {
        setLoading(false);
      }
    };
    fetchTransacciones();
  }, []);
 
  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    reset({ type: undefined, title: '', description: '', value: undefined });
    setShowForm(true);
  };
 
  const openEditModal = (t: Transaccion) => {
    setModalMode('edit');
    setEditingId(t._id);
    reset({ type: t.type, title: t.title, description: t.description, value: t.value });
    setShowForm(true);
  };
 
  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };
 
  const onSubmit = async (data: TransaccionForm) => {
    if (modalMode === 'create') {
      try {
        const res = await axios.post('/api/transactions', data);
        setTransacciones(prev => [res.data.transaction, ...prev]);
        toast.success('Transacción agregada con éxito');
        closeModal();
      } catch {
        toast.error('Error al agregar transacción');
      }
    } else {
      try {
        const res = await axios.patch(`/api/transactions/${editingId}`, data);
        setTransacciones(prev =>
          prev.map(t => (t._id === editingId ? res.data.transaction : t))
        );
        toast.success('Transacción actualizada');
        closeModal();
      } catch {
        toast.error('Error al actualizar transacción');
      }
    }
  };
 
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      // ✅ Optimistic update — filtra del array local
      setTransacciones(prev => prev.filter(t => t._id !== id));
      toast.success('Transacción eliminada');
    } catch {
      toast.error('Error al eliminar transacción');
    }
  };
 
  const ingresos = transacciones.filter(t => t.type === 'ingreso');
  const gastos = transacciones.filter(t => t.type === 'gasto');
 
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Skeleton height={48} className="mb-10 mx-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <Skeleton height={32} width={180} className="mb-6" />
              <Skeleton count={6} height={56} className="mb-3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }
 
  const TransactionTable = ({
    items,
    colorClass,
  }: {
    items: Transaccion[];
    colorClass: string;
  }) => (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full min-w-[540px] border-collapse bg-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700/80">
            <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Título</th>
            <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Descripción</th>
            <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Valor</th>
            <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Fecha</th>
            <th className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(t => (
            <tr
              key={t._id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="p-4 text-gray-900 dark:text-gray-100">{t.title}</td>
              <td className="p-4 text-gray-600 dark:text-gray-400">{t.description || '—'}</td>
              <td className={`p-4 font-medium ${colorClass}`}>
                ${t.value.toFixed(2)}
              </td>
              <td className="p-4 text-gray-600 dark:text-gray-400">
                {new Date(t.date).toLocaleDateString('es-AR')}
              </td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {/* ✅ Botón editar — nuevo */}
                  <button
                    onClick={() => openEditModal(t)}
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                               text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600
                               text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    Eliminar
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
      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800 dark:text-gray-100">
        Tus Transacciones
      </h1>
 
      {/* ✅ Sin botón "Refrescar Lista" — los optimistic updates lo hacen innecesario */}
      <div className="flex justify-start mb-10">
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600
                     text-white px-7 py-3 rounded-xl font-medium transition shadow-md"
        >
          + Agregar Nueva Transacción
        </button>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ingresos */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-green-700 dark:text-green-400">
            Ingresos
          </h2>
          {ingresos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              No hay ingresos registrados aún.
            </p>
          ) : (
            <TransactionTable
              items={ingresos}
              colorClass="text-green-600 dark:text-green-400"
            />
          )}
        </section>
 
        {/* Gastos */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-red-700 dark:text-red-400">
            Gastos
          </h2>
          {gastos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
              No hay gastos registrados aún.
            </p>
          ) : (
            <TransactionTable
              items={gastos}
              colorClass="text-red-600 dark:text-red-400"
            />
          )}
        </section>
      </div>
 
      {/* Modal crear / editar — unificado */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              aria-label="Cerrar modal"
            >
              ×
            </button>
 
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
              {/* ✅ Título del modal dinámico según modo */}
              {modalMode === 'create' ? 'Nueva Transacción' : 'Editar Transacción'}
            </h2>
 
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Tipo */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Tipo
                </label>
                <select
                  {...register('type', { required: 'El tipo es obligatorio' })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Selecciona</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.type.message}</p>
                )}
              </div>
 
              {/* Título */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Título
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'El título es obligatorio' })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                {errors.title && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.title.message}</p>
                )}
              </div>
 
              {/* Descripción */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Descripción <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
 
              {/* Valor */}
              <div className="mb-8">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('value', {
                    required: 'El valor es obligatorio',
                    min: { value: 0.01, message: 'Mínimo 0.01' },
                  })}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                {errors.value && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.value.message}</p>
                )}
              </div>
 
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600
                             text-white py-3 rounded-xl font-medium transition"
                >
                  {modalMode === 'create' ? 'Agregar' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600
                             text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {error && (
        <p className="text-red-600 dark:text-red-400 text-center mt-10 text-lg font-medium">
          {error}
        </p>
      )}
    </div>
  );
}