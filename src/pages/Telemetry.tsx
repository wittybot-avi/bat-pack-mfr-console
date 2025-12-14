import React, { useEffect, useState, useRef } from 'react';
import { batteryService } from '../services/api';
import { TelemetryPoint } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, RefreshCw } from 'lucide-react';

export default function Telemetry() {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState("batt-0");
  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Initial load
    batteryService.getBatteryTelemetry(selectedBatteryId).then(setData);
    
    return () => stopLive();
  }, [selectedBatteryId]);

  useEffect(() => {
    if (isLive) {
      startLive();
    } else {
      stopLive();
    }
    return () => stopLive();
  }, [isLive, data]);

  const startLive = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      // Simulate new point
      const last = data[data.length - 1] || { 
        voltage: 48, current: 10, temperature: 25, soc: 80 
      };
      
      const newPoint: TelemetryPoint = {
        timestamp: Date.now(),
        voltage: last.voltage + (Math.random() - 0.5) * 0.5,
        current: Math.max(0, last.current + (Math.random() - 0.5) * 2),
        temperature: last.temperature + (Math.random() - 0.5) * 0.2,
        soc: Math.max(0, last.soc - 0.01),
        cellMaxVol: 3.6,
        cellMinVol: 3.4
      };
      
      setData(prev => [...prev.slice(1), newPoint]); // Keep buffer size constant
    }, 1500);
  };

  const stopLive = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const lastPoint: Partial<TelemetryPoint> = data[data.length - 1] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Telemetry</h2>
          <p className="text-muted-foreground">Real-time monitoring for Battery: <span className="font-mono text-primary">{selectedBatteryId}</span></p>
        </div>
        <div className="flex items-center gap-2">
           <Input 
             className="w-40" 
             value={selectedBatteryId} 
             onChange={(e) => setSelectedBatteryId(e.target.value)} 
             placeholder="Battery ID"
           />
           <Button variant={isLive ? "secondary" : "default"} onClick={() => setIsLive(!isLive)}>
             {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
             {isLive ? "Pause" : "Live"}
           </Button>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Voltage</p>
            <p className="text-3xl font-mono font-bold text-emerald-400">{lastPoint.voltage?.toFixed(2)} V</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Current</p>
            <p className="text-3xl font-mono font-bold text-blue-400">{lastPoint.current?.toFixed(2)} A</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Temperature</p>
            <p className="text-3xl font-mono font-bold text-amber-400">{lastPoint.temperature?.toFixed(1)} °C</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider">State of Charge</p>
            <p className="text-3xl font-mono font-bold text-purple-400">{lastPoint.soc?.toFixed(1)} %</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Voltage / Current</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timestamp" tick={false} />
                <YAxis yAxisId="left" domain={[40, 60]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip labelFormatter={() => ''} />
                <Area yAxisId="left" type="monotone" dataKey="voltage" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area yAxisId="right" type="monotone" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Temperature</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timestamp" tick={false} />
                <YAxis domain={[20, 40]} />
                <Tooltip labelFormatter={() => ''} />
                <Area type="monotone" dataKey="temperature" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}