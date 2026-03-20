import Navbar from './navbar';
import DarkModeButton from './darkModeButton';
import Footer from './footer';
import { Outlet } from 'react-router';
 
export default function ProtectedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-800">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <DarkModeButton />
    </div>
  );
}