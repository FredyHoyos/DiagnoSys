import Login from '@/app/auth/login/page';
import Dashboard from '@/app/dashboard/page';

export default function Home() {
  return (
    <div className="font-sans flex flex-col items-center min-h-screen p-8 sm:p-20 gap-10">
      <Dashboard/>
    </div>
  );
}
