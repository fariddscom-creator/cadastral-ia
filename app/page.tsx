import DashboardClient from './dashboard-client';
import { getDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return <DashboardClient initialPayload={await getDashboardData()} />;
}
