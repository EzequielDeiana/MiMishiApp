import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
 
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
 
type MonthlySummary = {
  _id: string;
  ingresos: number;
  gastos: number;
};
 
export default function Home() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/api/transactions/summary');
        setSummary(res.data);
      } catch {
        setError('Error cargando resumen');
      } finally {
        setLoading(false);
      }
    };
 
    fetchSummary();
  }, []);
 
  const chartData: ChartData<'bar'> = {
    labels: summary.map(item => item._id),
    datasets: [
      {
        label: 'Ingresos',
        data: summary.map(item => item.ingresos || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.65)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: summary.map(item => item.gastos || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.65)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };
 
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Ingresos y Gastos por Mes' },
    },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { color: '#9ca3af' } },
    },
  };
 
  const currentMonthKey = new Date().toISOString().slice(0, 7); // "2026-03"
  const currentMonth = summary.find(s => s._id === currentMonthKey)
    ?? { ingresos: 0, gastos: 0 };
  const balance = currentMonth.ingresos - currentMonth.gastos;
 
  if (loading) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Skeleton height={40} width={320} className="mb-10 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <Skeleton height={20} width={120} className="mx-auto mb-3" />
            <Skeleton height={36} width={160} className="mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton height={420} className="rounded-xl shadow-md" />
    </div>
  );
 
  if (error) return (
    <div className="text-center py-16 text-red-600 dark:text-red-400 text-xl">
      {error}
    </div>
  );
 
  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-10 text-gray-800 dark:text-gray-100 text-center md:text-left">
        ¡Bienvenido de nuevo, {user?.username || 'Usuario'}!
      </h1>
 
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          Resumen del mes actual
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Ingresos</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${currentMonth.ingresos.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Gastos</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              ${currentMonth.gastos.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Balance</p>
            <p className={`text-3xl font-bold ${balance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
 
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {summary.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-16 text-lg">
            Aún no hay transacciones registradas. ¡Agrega tu primera!
          </p>
        ) : (
          <div className="h-[420px]">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}