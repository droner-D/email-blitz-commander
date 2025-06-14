
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Download, Trash2, Eye, Calendar, Mail, Clock, TrendingUp, AlertTriangle } from "lucide-react";

interface TestRecord {
  id: string;
  timestamp: string;
  server: string;
  port: string;
  recipients: number;
  threads: number;
  emailsPerThread: number;
  totalEmails: number;
  successful: number;
  failed: number;
  duration: number;
  avgResponseTime: number;
  status: 'completed' | 'failed' | 'cancelled';
  subject: string;
}

const TestHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Sample test history data
  const testHistory: TestRecord[] = [
    {
      id: 'test_001',
      timestamp: '2024-06-14 15:30:45',
      server: 'smtp.gmail.com',
      port: '587',
      recipients: 1000,
      threads: 5,
      emailsPerThread: 20,
      totalEmails: 100000,
      successful: 98500,
      failed: 1500,
      duration: 3600,
      avgResponseTime: 245,
      status: 'completed',
      subject: 'Marketing Campaign Q2'
    },
    {
      id: 'test_002',
      timestamp: '2024-06-14 12:15:30',
      server: 'smtp.sendgrid.net',
      port: '465',
      recipients: 500,
      threads: 3,
      emailsPerThread: 15,
      totalEmails: 22500,
      successful: 22350,
      failed: 150,
      duration: 1800,
      avgResponseTime: 189,
      status: 'completed',
      subject: 'Newsletter Weekly Update'
    },
    {
      id: 'test_003',
      timestamp: '2024-06-14 09:45:20',
      server: 'smtp.outlook.com',
      port: '587',
      recipients: 2000,
      threads: 10,
      emailsPerThread: 25,
      totalEmails: 500000,
      successful: 485000,
      failed: 15000,
      duration: 7200,
      avgResponseTime: 312,
      status: 'completed',
      subject: 'Product Launch Announcement'
    },
    {
      id: 'test_004',
      timestamp: '2024-06-13 16:20:10',
      server: 'smtp.mailgun.org',
      port: '587',
      recipients: 150,
      threads: 2,
      emailsPerThread: 10,
      totalEmails: 3000,
      successful: 0,
      failed: 0,
      duration: 0,
      avgResponseTime: 0,
      status: 'failed',
      subject: 'Authentication Test'
    },
    {
      id: 'test_005',
      timestamp: '2024-06-13 14:10:55',
      server: 'smtp.gmail.com',
      port: '587',
      recipients: 750,
      threads: 4,
      emailsPerThread: 18,
      totalEmails: 54000,
      successful: 48500,
      failed: 2500,
      duration: 2700,
      avgResponseTime: 278,
      status: 'cancelled',
      subject: 'Customer Survey 2024'
    },
  ];

  const filteredTests = testHistory.filter(test => {
    const matchesSearch = test.server.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && test.timestamp.startsWith('2024-06-14')) ||
                       (dateFilter === 'week' && new Date(test.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 hover:bg-green-700';
      case 'failed': return 'bg-red-600 hover:bg-red-700';
      case 'cancelled': return 'bg-yellow-600 hover:bg-yellow-700';
      default: return 'bg-slate-600 hover:bg-slate-700';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateSuccessRate = (successful: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Test History</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          <CardDescription className="text-slate-400">
            View and analyze previous SMTP load test results
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by server, subject, or test ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Records */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No test records found matching your criteria</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTests.map((test) => (
            <Card key={test.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{test.subject}</h3>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{test.timestamp}</span>
                        <span>•</span>
                        <span>ID: {test.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Server</div>
                    <div className="text-white font-semibold text-sm">{test.server}</div>
                    <div className="text-slate-500 text-xs">Port {test.port}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Recipients</div>
                    <div className="text-white font-semibold">{test.recipients.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Configuration</div>
                    <div className="text-white font-semibold">{test.threads}T × {test.emailsPerThread}E</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Total Emails</div>
                    <div className="text-white font-semibold">{test.totalEmails.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Success Rate</div>
                    <div className={`font-semibold ${test.status === 'completed' ? 
                      calculateSuccessRate(test.successful, test.totalEmails) >= 95 ? 'text-green-400' : 
                      calculateSuccessRate(test.successful, test.totalEmails) >= 90 ? 'text-yellow-400' : 'text-red-400'
                      : 'text-slate-400'}`}>
                      {test.status === 'completed' ? `${calculateSuccessRate(test.successful, test.totalEmails)}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Duration</div>
                    <div className="text-white font-semibold">{formatDuration(test.duration)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Avg Response</div>
                    <div className="text-white font-semibold">
                      {test.avgResponseTime > 0 ? `${test.avgResponseTime}ms` : 'N/A'}
                    </div>
                  </div>
                </div>

                {test.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-slate-400 text-sm">Successful:</span>
                      <span className="text-green-400 font-semibold">{test.successful.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-slate-400 text-sm">Failed:</span>
                      <span className="text-red-400 font-semibold">{test.failed.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-sm">Rate:</span>
                      <span className="text-blue-400 font-semibold">
                        {test.duration > 0 ? Math.round(test.totalEmails / test.duration * 60) : 0}/min
                      </span>
                    </div>
                  </div>
                )}

                {test.status === 'failed' && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">This test failed to complete due to configuration or connection issues</span>
                    </div>
                  </div>
                )}

                {test.status === 'cancelled' && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">This test was manually cancelled before completion</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredTests.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Summary Statistics</CardTitle>
            <CardDescription className="text-slate-400">
              Aggregate statistics for displayed test records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-slate-400 text-sm">Total Tests</div>
                <div className="text-2xl font-bold text-white">{filteredTests.length}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-sm">Completed</div>
                <div className="text-2xl font-bold text-green-400">
                  {filteredTests.filter(t => t.status === 'completed').length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-sm">Total Emails</div>
                <div className="text-2xl font-bold text-white">
                  {filteredTests.reduce((sum, test) => sum + test.totalEmails, 0).toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-sm">Avg Success Rate</div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(filteredTests
                    .filter(t => t.status === 'completed')
                    .reduce((sum, test, _, arr) => sum + calculateSuccessRate(test.successful, test.totalEmails) / arr.length, 0)
                  )}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestHistory;
