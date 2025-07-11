
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Clock, CheckCircle, XCircle, Zap, Mail, TrendingUp, AlertTriangle } from "lucide-react";
import { testStateService } from '@/services/TestStateService';
import { ErrorLog, SMTPResponse } from '../../backend/src/types';

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
    errors: [] as ErrorLog[],
    smtpResponses: [] as SMTPResponse[],
  });

  const [chartData, setChartData] = useState<Array<{ time: string; sent: number; errors: number; responseTime: number }>>([]);
  const [persistedResponses, setPersistedResponses] = useState<{
    errors: ErrorLog[],
    smtpResponses: SMTPResponse[]
  }>({ errors: [], smtpResponses: [] });

  // Subscribe to global test state
  useEffect(() => {
    const unsubscribe = testStateService.subscribe((state) => {
      const testData = state.currentTest || state.lastCompletedTest;
      if (testData) {
        updateResultsFromTestData(testData);
      }
    });

    return unsubscribe;
  }, []);

  // Clear persisted responses when a new test starts
  useEffect(() => {
    if (testStatus === 'running' && currentTest) {
      // Only clear if this is actually a new test start
      const isNewTest = results.totalEmails === 0 || results.sentSuccessfully === 0;
      if (isNewTest) {
        setPersistedResponses({ errors: [], smtpResponses: [] });
        setChartData([]);
      }
    }
  }, [testStatus, currentTest]);

  const updateResultsFromTestData = (testData: any) => {
    const runtime = testData.endTime 
      ? (new Date(testData.endTime).getTime() - new Date(testData.startTime).getTime()) / 1000
      : (Date.now() - new Date(testData.startTime).getTime()) / 1000;

    setResults({
      totalEmails: testData.totalEmails,
      sentSuccessfully: testData.sentSuccessfully,
      failed: testData.failed,
      emailsPerSecond: testData.emailsPerSecond || 0,
      emailsPerMinute: Math.round((testData.emailsPerSecond || 0) * 60),
      totalTime: new Date(testData.startTime).getTime(),
      avgResponseTime: testData.avgResponseTime || 0,
      maxResponseTime: testData.maxResponseTime || 0,
      minResponseTime: testData.minResponseTime || 0,
      progress: testData.progress || 0,
      activeThreads: currentTest?.threads || 0,
      errors: testData.errors || [],
      smtpResponses: testData.smtpResponses || [],
    });

    // Update persisted responses when test data changes
    if (testData.errors && testData.errors.length > 0) {
      setPersistedResponses(prev => ({
        ...prev,
        errors: [...prev.errors, ...testData.errors].slice(-50) // Keep last 50
      }));
    }

    if (testData.smtpResponses && testData.smtpResponses.length > 0) {
      setPersistedResponses(prev => ({
        ...prev,
        smtpResponses: [...prev.smtpResponses, ...testData.smtpResponses].slice(-50) // Keep last 50
      }));
    }

    // Update chart data if test is active
    if (testData.status === 'running') {
      const currentTime = new Date().toLocaleTimeString();
      setChartData(prevChart => {
        const newData = [...prevChart, {
          time: currentTime,
          sent: testData.sentSuccessfully,
          errors: testData.failed,
          responseTime: testData.avgResponseTime || 0
        }];
        return newData.slice(-20); // Keep last 20 data points
      });
    }
  };

  // Simulate real-time data updates for running tests
  useEffect(() => {
    if (testStatus === 'running' && currentTest) {
      const interval = setInterval(() => {
        setResults(prev => {
          const newSent = prev.sentSuccessfully + Math.floor(Math.random() * 3) + 1;
          const newFailed = prev.failed + (Math.random() > 0.95 ? 1 : 0); // Less frequent failures
          const totalSent = newSent + newFailed;
          
          // Calculate progress based on test mode
          let progress = 0;
          if (currentTest.testMode === 'count' && currentTest.totalEmails) {
            progress = Math.min((totalSent / currentTest.totalEmails) * 100, 100);
          } else if (currentTest.testMode === 'duration' && currentTest.duration) {
            const runtime = (Date.now() - (prev.totalTime || Date.now())) / 1000;
            progress = Math.min((runtime / currentTest.duration) * 100, 100);
          }
          
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
            return newData.slice(-20);
          });

          // Create properly typed error and response objects
          const newErrors: ErrorLog[] = [];
          const newResponses: SMTPResponse[] = [];

          // Add a sample error if failed count increased
          if (newFailed > prev.failed) {
            const newError: ErrorLog = {
              timestamp: new Date(),
              error: "SMTP connection timeout",
              recipient: currentTest.recipients[Math.floor(Math.random() * currentTest.recipients.length)],
              thread: Math.floor(Math.random() * currentTest.threads) + 1
            };
            newErrors.push(newError);
            
            // Add to persisted responses
            setPersistedResponses(persistedPrev => ({
              ...persistedPrev,
              errors: [...persistedPrev.errors, newError].slice(-50)
            }));
          }

          // Add a sample success response
          if (newSent > prev.sentSuccessfully) {
            const newResponse: SMTPResponse = {
              timestamp: new Date(),
              response: "250 2.0.0 OK",
              status: 'success' as const,
              recipient: currentTest.recipients[Math.floor(Math.random() * currentTest.recipients.length)],
              responseTime: newResponseTime
            };
            newResponses.push(newResponse);
            
            // Add to persisted responses
            setPersistedResponses(persistedPrev => ({
              ...persistedPrev,
              smtpResponses: [...persistedPrev.smtpResponses, newResponse].slice(-50)
            }));
          }

          const updatedResults = {
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
            errors: [...prev.errors, ...newErrors].slice(-10), // Keep last 10 errors
            smtpResponses: [...prev.smtpResponses, ...newResponses].slice(-10), // Keep last 10 responses
          };

          // Update global state
          testStateService.updateTestProgress({
            id: 'current',
            configId: currentTest.id || '',
            status: 'running',
            startTime: new Date(prev.totalTime || Date.now()),
            totalEmails: totalSent,
            sentSuccessfully: newSent,
            failed: newFailed,
            emailsPerSecond: updatedResults.emailsPerSecond,
            avgResponseTime: updatedResults.avgResponseTime,
            maxResponseTime: updatedResults.maxResponseTime,
            minResponseTime: updatedResults.minResponseTime,
            errors: updatedResults.errors,
            smtpResponses: updatedResults.smtpResponses
          });

          return updatedResults;
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
                <p className="text-xs text-green-400">
                  {results.totalEmails > 0 ? Math.round((results.sentSuccessfully / results.totalEmails) * 100) : 0}% success rate
                </p>
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
                <p className="text-xs text-red-400">
                  {results.totalEmails > 0 ? Math.round((results.failed / results.totalEmails) * 100) : 0}% failure rate
                </p>
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
                <p className="text-xs text-blue-400">Current throughput</p>
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
                <p className="text-2xl font-bold text-white">{Math.round(results.avgResponseTime)}ms</p>
                <p className="text-xs text-purple-400">
                  Min: {Math.round(results.minResponseTime)}ms, Max: {Math.round(results.maxResponseTime)}ms
                </p>
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

      {/* SMTP Responses with retained data */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-white">SMTP Responses & Errors (Retained)</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            All responses are retained until the next test starts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Success Responses */}
            <div>
              <h4 className="text-green-400 font-medium mb-3">
                Successful Responses ({persistedResponses.smtpResponses.filter(r => r.status === 'success').length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {persistedResponses.smtpResponses.filter(r => r.status === 'success').slice(-10).reverse().map((response, index) => (
                  <div key={index} className="p-2 bg-green-900/20 border border-green-800/30 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 text-xs">{new Date(response.timestamp).toLocaleTimeString()}</span>
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <div className="text-green-300 text-xs mb-1">To: {response.recipient}</div>
                    <code className="text-green-300 text-xs">{response.response}</code>
                    <div className="text-green-400 text-xs mt-1">Response time: {Math.round(response.responseTime)}ms</div>
                  </div>
                ))}
                {persistedResponses.smtpResponses.filter(r => r.status === 'success').length === 0 && (
                  <p className="text-slate-400 text-sm">No successful responses yet</p>
                )}
              </div>
            </div>

            {/* Error Responses */}
            <div>
              <h4 className="text-red-400 font-medium mb-3">
                Failed Responses ({persistedResponses.errors.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {persistedResponses.errors.slice(-10).reverse().map((error, index) => (
                  <div key={index} className="p-2 bg-red-900/20 border border-red-800/30 rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-400 text-xs">Thread {error.thread}</span>
                      <span className="text-slate-400 text-xs">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-red-300 text-xs mb-1">To: {error.recipient}</div>
                    <code className="text-red-300 text-xs">{error.error}</code>
                  </div>
                ))}
                {persistedResponses.errors.length === 0 && (
                  <p className="text-slate-400 text-sm">No errors recorded</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadTestResults;
