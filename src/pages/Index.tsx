
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Settings, BarChart3, History, Play, Pause, Square } from "lucide-react";
import SMTPConfiguration from '@/components/SMTPConfiguration';
import LoadTestResults from '@/components/LoadTestResults';
import Dashboard from '@/components/Dashboard';
import TestHistory from '@/components/TestHistory';
import { testHistoryService } from '@/services/TestHistoryService';
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentTest, setCurrentTest] = useState(null);

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'results', label: 'Live Results', icon: BarChart3 },
    { id: 'dashboard', label: 'Dashboard', icon: Mail },
    { id: 'history', label: 'Test History', icon: History },
  ];

  const handleStartTest = (config: any) => {
    setCurrentTest(config);
    setTestStatus('running');
    setActiveTab('results');
    
    // Simulate a test run for demo purposes
    simulateTestRun(config);
    
    toast({
      title: "Test Started",
      description: `Load test initiated with ${config.threads} threads and ${config.recipients.length} recipients.`,
    });
  };

  const simulateTestRun = (config: any) => {
    // Create a mock test result for demonstration
    const mockResult = {
      id: `test_${Date.now()}`,
      configId: config.id || '',
      status: 'completed' as const,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30000), // 30 seconds later
      totalEmails: config.totalEmails || config.threads * config.emailsPerThread,
      sentSuccessfully: Math.floor((config.totalEmails || config.threads * config.emailsPerThread) * 0.95),
      failed: Math.floor((config.totalEmails || config.threads * config.emailsPerThread) * 0.05),
      emailsPerSecond: 15.5,
      avgResponseTime: 245,
      maxResponseTime: 850,
      minResponseTime: 120,
      errors: [],
      smtpResponses: []
    };

    // Simulate test completion after a delay
    setTimeout(() => {
      setTestStatus('completed');
      testHistoryService.saveTestResult(mockResult, config);
      
      toast({
        title: "Test Completed",
        description: `Test finished successfully. Check the history tab for details.`,
      });
    }, 5000);
  };

  const handleStopTest = () => {
    setTestStatus('completed');
  };

  const handlePauseTest = () => {
    setTestStatus(testStatus === 'paused' ? 'running' : 'paused');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                SMTP Load Tester
              </h1>
              <p className="text-slate-300">Advanced email performance testing platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={testStatus === 'running' ? 'default' : testStatus === 'paused' ? 'secondary' : 'outline'}
                className={`px-3 py-1 ${
                  testStatus === 'running' ? 'bg-green-600 hover:bg-green-700' : 
                  testStatus === 'paused' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                  'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {testStatus === 'running' && <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />}
                {testStatus.charAt(0).toUpperCase() + testStatus.slice(1)}
              </Badge>
              {testStatus === 'running' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handlePauseTest}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleStopTest}>
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg backdrop-blur-sm border border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'config' && (
            <SMTPConfiguration onStartTest={handleStartTest} testStatus={testStatus} />
          )}
          {activeTab === 'results' && (
            <LoadTestResults currentTest={currentTest} testStatus={testStatus} />
          )}
          {activeTab === 'dashboard' && (
            <Dashboard />
          )}
          {activeTab === 'history' && (
            <TestHistory />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
