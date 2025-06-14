
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Mail, Clock, Gauge, Activity, AlertCircle, Server } from "lucide-react";
import { testHistoryService } from '@/services/TestHistoryService';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [cumulativeData, setCumulativeData] = useState<Array<{ time: string; cumulative: number; rate: number }>>([]);
  const [intervalData, setIntervalData] = useState<Array<{ interval: string; sent: number; errors: number }>>([]);
  const [serverStats, setServerStats] = useState<Array<{ server: string; emails: number; success: number; failed: number }>>([]);

  // Generate sample data and load actual server stats
  useEffect(() => {
    // Generate cumulative data
    const cumulative = [];
    let total = 0;
    for (let i = 0; i < 24; i++) {
      const increment = Math.floor(Math.random() * 100) + 50;
      total += increment;
      cumulative.push({
        time: `${i}:00`,
        cumulative: total,
        rate: increment
      });
    }
    setCumulativeData(cumulative);

    // Generate 5-second interval data
    const intervals = [];
    for (let i = 0; i < 12; i++) {
      intervals.push({
        interval: `${i * 5}s`,
        sent: Math.floor(Math.random() * 20) + 10,
        errors: Math.floor(Math.random() * 3)
      });
    }
    setIntervalData(intervals);

    // Load actual server statistics from test history
    loadServerStatistics();
  }, [timeRange]);

  const loadServerStatistics = () => {
    const testHistory = testHistoryService.getTestHistory();
    
    if (testHistory.length === 0) {
      setServerStats([]);
      return;
    }

    // Group tests by server and calculate statistics
    const serverMap = new Map();
    
    testHistory.forEach(test => {
      const serverKey = `${test.server}:${test.port}`;
      
      if (!serverMap.has(serverKey)) {
        serverMap.set(serverKey, {
          server: test.server,
          port: test.port,
          totalEmails: 0,
          sentSuccessfully: 0,
          failed: 0,
          testCount: 0
        });
      }
      
      const serverData = serverMap.get(serverKey);
      serverData.totalEmails += test.totalEmails;
      serverData.sentSuccessfully += test.sentSuccessfully;
      serverData.failed += test.failed;
      serverData.testCount += 1;
    });

    // Convert to array format for display
    const stats = Array.from(serverMap.values()).map(server => ({
      server: `${server.server}:${server.port}`,
      emails: server.totalEmails,
      success: server.sentSuccessfully,
      failed: server.failed
    }));

    setServerStats(stats);
  };

  const pieData = [
    { name: 'Successful', value: 4965, color: '#10B981' },
    { name: 'Failed', value: 115, color: '#EF4444' },
    { name: 'Pending', value: 20, color: '#F59E0B' },
  ];

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-slate-400">Comprehensive email performance insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Total Sent</p>
                <p className="text-2xl font-bold text-white">5,100</p>
                <p className="text-xs text-green-400">+12% from yesterday</p>
              </div>
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">97.7%</p>
                <p className="text-xs text-green-400">+2.1% improvement</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Avg Response</p>
                <p className="text-2xl font-bold text-white">245ms</p>
                <p className="text-xs text-red-400">+15ms slower</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">Peak Rate</p>
                <p className="text-2xl font-bold text-white">156/min</p>
                <p className="text-xs text-green-400">New record!</p>
              </div>
              <Gauge className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Emails Chart */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Cumulative Emails Sent Over Time</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Total email volume progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cumulative"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Cumulative"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="rate"
                    fill="#10B981"
                    opacity={0.7}
                    name="Rate"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Email Distribution */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <CardTitle className="text-white">Email Status Distribution</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Breakdown of email delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-slate-300 text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5-Second Intervals Chart */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Emails Sent (5-Second Intervals)</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            High-resolution email sending pattern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={intervalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="interval" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="sent" fill="#10B981" name="Sent" />
                <Bar dataKey="errors" fill="#EF4444" name="Errors" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Server Performance - Now shows actual test results */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-white">Server Performance</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Performance breakdown by SMTP server from recent tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverStats.length === 0 ? (
            <div className="text-center py-8">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No server data available</p>
              <p className="text-slate-500 text-sm">Run some tests to see server performance statistics here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serverStats.map((server, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${server.failed / server.emails > 0.05 ? 'bg-red-400' : 'bg-green-400'}`} />
                    <div>
                      <p className="text-white font-semibold">{server.server}</p>
                      <p className="text-slate-400 text-sm">
                        {server.emails.toLocaleString()} total emails
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-6">
                      <div className="text-emerald-400">
                        <div className="font-semibold">{server.success.toLocaleString()}</div>
                        <div className="text-xs">Success</div>
                      </div>
                      <div className="text-rose-400">
                        <div className="font-semibold">{server.failed.toLocaleString()}</div>
                        <div className="text-xs">Failed</div>
                      </div>
                      <div className="text-white">
                        <div className="font-semibold">
                          {Math.round((server.success / server.emails) * 100)}%
                        </div>
                        <div className="text-xs text-slate-400">Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
