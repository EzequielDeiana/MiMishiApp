import Navbar from './navbar';
import { Outlet } from 'react-router';
 
export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}