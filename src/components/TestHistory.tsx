
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Eye, Trash2, Clock, CheckCircle, XCircle, Server, Mail, AlertTriangle } from "lucide-react";
import { testHistoryService } from '@/services/TestHistoryService';
import { toast } from "@/hooks/use-toast";

const TestHistory = () => {
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  useEffect(() => {
    loadTestHistory();
  }, []);

  const loadTestHistory = () => {
    const history = testHistoryService.getTestHistory();
    setTestHistory(history);
  };

  const handleClearHistory = () => {
    testHistoryService.clearHistory();
    setTestHistory([]);
    toast({
      title: "History Cleared",
      description: "All test history has been cleared.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-400/30';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m ${duration % 60}s`;
    return `${Math.round(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`;
  };

  const TestDetails = ({ test }: { test: any }) => (
    <div className="space-y-6">
      {/* Test Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-sm">Total Emails</span>
          </div>
          <div className="text-2xl font-bold text-white">{test.totalEmails.toLocaleString()}</div>
        </div>
        
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-slate-400 text-sm">Successful</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{test.sentSuccessfully.toLocaleString()}</div>
        </div>
        
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-slate-400 text-sm">Failed</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{test.failed.toLocaleString()}</div>
        </div>
        
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400 text-sm">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {test.totalEmails > 0 ? Math.round((test.sentSuccessfully / test.totalEmails) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Emails/Second:</span>
              <span className="text-white">{test.emailsPerSecond?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Response:</span>
              <span className="text-white">{Math.round(test.avgResponseTime || 0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Response:</span>
              <span className="text-white">{Math.round(test.maxResponseTime || 0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Min Response:</span>
              <span className="text-white">{Math.round(test.minResponseTime || 0)}ms</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Server Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Server:</span>
              <span className="text-white">{test.server}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Port:</span>
              <span className="text-white">{test.port}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subject:</span>
              <span className="text-white truncate max-w-32" title={test.subject}>
                {test.subject}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Timing</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Started:</span>
              <span className="text-white">
                {new Date(test.startTime).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ended:</span>
              <span className="text-white">
                {test.endTime ? new Date(test.endTime).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="text-white">
                {formatDuration(test.startTime, test.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {test.errors && test.errors.length > 0 && (
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Recent Errors ({test.errors.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {test.errors.slice(-10).map((error: any, index: number) => (
              <div key={index} className="p-2 bg-red-900/20 border border-red-800/30 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-400">{error.recipient}</span>
                  <span className="text-slate-400 text-xs">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <code className="text-red-300 text-xs">{error.error}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (testHistory.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No test history available</p>
            <p className="text-sm">Run some tests to see the history here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Test History</h2>
          <p className="text-slate-400">{testHistory.length} test(s) recorded</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearHistory}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
      </div>

      {/* Test History List */}
      <div className="space-y-4">
        {testHistory.map((test, index) => (
          <Card key={test.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <Badge className={`px-2 py-1 text-xs ${getStatusColor(test.status)}`}>
                      {test.status}
                    </Badge>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Server className="w-4 h-4" />
                      <span>{test.server}:{test.port}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(test.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Total: </span>
                      <span className="text-white font-semibold">{test.totalEmails.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Success: </span>
                      <span className="text-green-400 font-semibold">{test.sentSuccessfully.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Failed: </span>
                      <span className="text-red-400 font-semibold">{test.failed.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Rate: </span>
                      <span className="text-white font-semibold">
                        {test.totalEmails > 0 ? Math.round((test.sentSuccessfully / test.totalEmails) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => setSelectedTest(test)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Test Details - {new Date(test.timestamp).toLocaleString()}
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Complete test results and performance metrics
                      </DialogDescription>
                    </DialogHeader>
                    {selectedTest && <TestDetails test={selectedTest} />}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestHistory;
