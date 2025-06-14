
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Clock, CheckCircle, XCircle, Zap, Mail, TrendingUp, AlertTriangle } from "lucide-react";

interface LoadTestResultsProps {
  currentTest: any;
  testStatus: string;
}

const LoadTestResults = ({ currentTest, testStatus }: LoadTestResultsProps) => {
  const [results, setResults] = useState({
    totalEmails: 0,
    sentSuccessfully: 0,
    failed: 0,
    emailsPerSecond: 0,
    emailsPerMinute: 0,
    totalTime: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    progress: 0,
    activeThreads: 0,
    errors: [] as Array<{ timestamp: string; error: string; recipient: string }>,
    smtpResponses: [] as Array<{ timestamp: string; response: string; status: 'success' | 'error' }>,
  });

  const [chartData, setChartData] = useState<Array<{ time: string; sent: number; errors: number; responseTime: number }>>([]);

  // Simulate real-time data updates
  useEffect(() => {
    if (testStatus === 'running' && currentTest) {
      const interval = setInterval(() => {
        setResults(prev => {
          const newSent = prev.sentSuccessfully + Math.floor(Math.random() * 5) + 1;
          const newFailed = prev.failed + (Math.random() > 0.9 ? 1 : 0);
          const totalSent = newSent + newFailed;
          const totalTarget = currentTest.threads * currentTest.emailsPerThread * currentTest.recipients.length;
          const progress = Math.min((totalSent / totalTarget) * 100, 100);
          
          const currentTime = new Date().toLocaleTimeString();
          const newResponseTime = 100 + Math.random() * 200;
          
          // Add new chart data point
          setChartData(prevChart => {
            const newData = [...prevChart, {
              time: currentTime,
              sent: newSent,
              errors: newFailed,
              responseTime: newResponseTime
            }];
            return newData.slice(-20); // Keep last 20 data points
          });

          // Add random SMTP responses
          if (Math.random() > 0.7) {
            const responses = prev.smtpResponses.slice(-10);
            responses.push({
              timestamp: currentTime,
              response: Math.random() > 0.8 ? '550 Mailbox unavailable' : '250 Message accepted',
              status: Math.random() > 0.8 ? 'error' : 'success'
            });
            
            return {
              ...prev,
              sentSuccessfully: newSent,
              failed: newFailed,
              totalEmails: totalSent,
              progress,
              emailsPerSecond: Math.round(totalSent / ((Date.now() - (prev.totalTime || Date.now())) / 1000 || 1)),
              emailsPerMinute: Math.round(totalSent / ((Date.now() - (prev.totalTime || Date.now())) / 60000 || 1) * 60),
              totalTime: prev.totalTime || Date.now(),
              avgResponseTime: Math.round((prev.avgResponseTime * (totalSent - 1) + newResponseTime) / totalSent),
              maxResponseTime: Math.max(prev.maxResponseTime, newResponseTime),
              minResponseTime: prev.minResponseTime === 0 ? newResponseTime : Math.min(prev.minResponseTime, newResponseTime),
              activeThreads: currentTest.threads,
              smtpResponses: responses
            };
          }

          return {
            ...prev,
            sentSuccessfully: newSent,
            failed: newFailed,
            totalEmails: totalSent,
            progress,
            emailsPerSecond: Math.round(totalSent / ((Date.now() - (prev.totalTime || Date.now())) / 1000 || 1)),
            emailsPerMinute: Math.round(totalSent / ((Date.now() - (prev.totalTime || Date.now())) / 60000 || 1) * 60),
            totalTime: prev.totalTime || Date.now(),
            avgResponseTime: Math.round((prev.avgResponseTime * (totalSent - 1) + newResponseTime) / totalSent),
            maxResponseTime: Math.max(prev.maxResponseTime, newResponseTime),
            minResponseTime: prev.minResponseTime === 0 ? newResponseTime : Math.min(prev.minResponseTime, newResponseTime),
            activeThreads: currentTest.threads,
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [testStatus, currentTest]);

  if (!currentTest) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-slate-400">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active test. Configure and start a test to see results.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Progress */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Test Progress</CardTitle>
            </div>
            <Badge 
              variant={testStatus === 'running' ? 'default' : 'secondary'}
              className={testStatus === 'running' ? 'bg-green-600' : 'bg-slate-600'}
            >
              {testStatus === 'running' && <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />}
              {testStatus.charAt(0).toUpperCase() + testStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-white font-semibold">{Math.round(results.progress)}%</span>
            </div>
            <Progress value={results.progress} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-slate-400">Active Threads</div>
                <div className="text-xl font-bold text-white">{results.activeThreads}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Server</div>
                <div className="text-white font-semibold">{currentTest.server}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Recipients</div>
                <div className="text-white font-semibold">{currentTest.recipients.length}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Runtime</div>
                <div className="text-white font-semibold">
                  {Math.round((Date.now() - (results.totalTime || Date.now())) / 1000)}s
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Emails Sent</p>
                <p className="text-2xl font-bold text-white">{results.sentSuccessfully}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{results.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Emails/Second</p>
                <p className="text-2xl font-bold text-white">{results.emailsPerSecond}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Avg Response</p>
                <p className="text-2xl font-bold text-white">{results.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <CardTitle className="text-white">Email Throughput</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Real-time email sending performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    name="Emails Sent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Response Times</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              SMTP server response performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name="Response Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-slate-400 text-sm">Total Emails</div>
              <div className="text-2xl font-bold text-white">{results.totalEmails}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm">Success Rate</div>
              <div className="text-2xl font-bold text-green-400">
                {results.totalEmails > 0 ? Math.round((results.sentSuccessfully / results.totalEmails) * 100) : 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm">Max Response Time</div>
              <div className="text-2xl font-bold text-orange-400">{Math.round(results.maxResponseTime)}ms</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm">Min Response Time</div>
              <div className="text-2xl font-bold text-blue-400">{Math.round(results.minResponseTime)}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Responses */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-white">Recent SMTP Responses</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.smtpResponses.length === 0 ? (
              <p className="text-slate-400 text-sm">No SMTP responses yet...</p>
            ) : (
              results.smtpResponses.slice(-10).reverse().map((response, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-700/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${response.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-slate-300">{response.timestamp}</span>
                  </div>
                  <code className={`text-xs px-2 py-1 rounded ${response.status === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                    {response.response}
                  </code>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadTestResults;
