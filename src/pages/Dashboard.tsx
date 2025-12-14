import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { KPIData } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/design-system';
import { Battery, Box, CheckCircle, Truck, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const KPICard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`text-xs ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getKPIs().then(data => {
      setKpi(data);
      setLoading(false);
    });
  }, []);

  const chartData = [
    { name: 'Mon', passed: 40, failed: 2 },
    { name: 'Tue', passed: 30, failed: 1 },
    { name: 'Wed', passed: 45, failed: 3 },
    { name: 'Thu', passed: 50, failed: 0 },
    { name: 'Fri', passed: 60, failed: 2 },
    { name: 'Sat', passed: 20, failed: 0 },
    { name: 'Sun', passed: 10, failed: 0 },
  ];

  const healthData = [
    { name: 'Batch A', soh: 98 },
    { name: 'Batch B', soh: 97 },
    { name: 'Batch C', soh: 94 },
    { name: 'Batch D', soh: 99 },
    { name: 'Batch E', soh: 96 },
  ];

  if (loading) return <div className="flex items-center justify-center h-full">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of manufacturing operations and battery health.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Batteries" value={kpi?.totalBatteries} icon={Battery} trend={12} color="indigo" />
        <KPICard title="Active Batches" value={kpi?.activeBatches} icon={Box} trend={0} color="blue" />
        <KPICard title="EOL Pass Rate" value={`${kpi?.eolPassRate}%`} icon={CheckCircle} trend={0.5} color="emerald" />
        <KPICard title="Open Exceptions" value={kpi?.exceptions} icon={AlertTriangle} trend={-20} color="amber" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>EOL Production Output</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="passed" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Passed" />
                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Average Batch SOH</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[90, 100]} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="soh" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}