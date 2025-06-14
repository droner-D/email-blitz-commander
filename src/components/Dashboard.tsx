
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Mail, Clock, Gauge, Activity, AlertCircle, Server } from "lucide-react";
import { testHistoryService } from '@/services/TestHistoryService';
import { testStateService } from '@/services/TestStateService';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [currentTestData, setCurrentTestData] = useState<any>(null);
  const [serverStats, setServerStats] = useState<Array<{ server: string; emails: number; success: number; failed: number }>>([]);

  useEffect(() => {
    // Subscribe to test state changes
    const unsubscribe = testStateService.subscribe((state) => {
      const latestTest = testStateService.getLatestTestResults();
      if (latestTest) {
        setCurrentTestData(latestTest);
        // Reload server stats when test data changes
        loadServerStatistics();
      }
    });

    // Load initial data
    const latestTest = testStateService.getLatestTestResults();
    if (latestTest) {
      setCurrentTestData(latestTest);
    }

    loadServerStatistics();

    return unsubscribe;
  }, [timeRange]);

  const loadServerStatistics = () => {
    const testHistory = testHistoryService.getTestHistory();
    const currentState = testStateService.getCurrentState();
    
    // Include current/completed test data in server stats
    const allTests = [...testHistory];
    if (currentState.currentTest) {
      // Create a test history compatible object from current test
      const currentTestForStats = {
        id: currentState.currentTest.id,
        timestamp: currentState.currentTest.startTime,
        config: {
          server: 'Current Test Server', // This should come from the actual config
          port: 587, // This should come from the actual config
        },
        result: currentState.currentTest,
        server: 'Current Test Server',
        port: 587,
        totalEmails: currentState.currentTest.totalEmails,
        sentSuccessfully: currentState.currentTest.sentSuccessfully,
        failed: currentState.currentTest.failed,
      };
      allTests.push(currentTestForStats);
    }

    if (allTests.length === 0) {
      setServerStats([]);
      return;
    }

    // Group tests by server and calculate statistics
    const serverMap = new Map();
    
    allTests.forEach(test => {
      const serverKey = `${test.server || test.config?.server || 'Unknown'}:${test.port || test.config?.port || 'Unknown'}`;
      
      if (!serverMap.has(serverKey)) {
        serverMap.set(serverKey, {
          server: test.server || test.config?.server || 'Unknown',
          port: test.port || test.config?.port || 'Unknown',
          totalEmails: 0,
          sentSuccessfully: 0,
          failed: 0,
          testCount: 0
        });
      }
      
      const serverData = serverMap.get(serverKey);
      serverData.totalEmails += test.totalEmails || test.result?.totalEmails || 0;
      serverData.sentSuccessfully += test.sentSuccessfully || test.result?.sentSuccessfully || 0;
      serverData.failed += test.failed || test.result?.failed || 0;
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

  // Use real data if available, otherwise show default state
  const displayData = currentTestData || {
    totalEmails: 0,
    sentSuccessfully: 0,
    failed: 0,
    emailsPerSecond: 0,
    avgResponseTime: 0
  };

  const successRate = displayData.totalEmails > 0 
    ? (displayData.sentSuccessfully / displayData.totalEmails) * 100 
    : 0;

  const pieData = [
    { name: 'Successful', value: displayData.sentSuccessfully, color: '#10B981' },
    { name: 'Failed', value: displayData.failed, color: '#EF4444' },
  ];

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-slate-400">
            {currentTestData ? 'Live email performance insights' : 'Run a test to see performance insights'}
          </p>
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

      {/* Charts - only show if we have data */}
      {currentTestData && displayData.totalEmails > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Distribution */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">Email Status Distribution</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Current test breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
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

          {/* Error Log */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <CardTitle className="text-white">Recent Errors</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Latest error messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto space-y-2">
                {currentTestData.errors && currentTestData.errors.length > 0 ? (
                  currentTestData.errors.slice(-10).reverse().map((error: any, index: number) => (
                    <div key={index} className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 text-sm font-medium">{error.recipient}</span>
                        <span className="text-slate-400 text-xs">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{error.error}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No errors recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Server Performance */}
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
