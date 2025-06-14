import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Upload, Users, Mail, Server, Lock, Clock, Layers, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SMTPConfig {
  server: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  useAuth: boolean;
  useSSL: boolean;
  subject: string;
  message: string;
  recipients: string[];
  threads: number;
  delay: number;
  attachment: File | null;
  customHeaders: { [key: string]: string };
  testMode: 'count' | 'duration' | 'continuous';
  totalEmails?: number;
  duration?: number;
}

interface SMTPConfigurationProps {
  onStartTest: (config: SMTPConfig) => void;
  testStatus: string;
}

const SMTPConfiguration = ({ onStartTest, testStatus }: SMTPConfigurationProps) => {
  const [config, setConfig] = useState<SMTPConfig>({
    server: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    useAuth: false,
    useSSL: false,
    subject: '',
    message: '',
    recipients: [],
    threads: 1,
    delay: 1000,
    attachment: null,
    customHeaders: {},
    testMode: 'count',
    totalEmails: 100,
    duration: 60,
  });

  const [recipientInput, setRecipientInput] = useState('');
  const [recipientFile, setRecipientFile] = useState<File | null>(null);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleInputChange = (field: keyof SMTPConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addRecipient = () => {
    if (recipientInput.trim() && !config.recipients.includes(recipientInput.trim())) {
      setConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput.trim()]
      }));
      setRecipientInput('');
    }
  };

  const removeRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'recipients' | 'attachment') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'recipients') {
      setRecipientFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const emails = content.split(/[\n,;]/).map(email => email.trim()).filter(email => email);
        setConfig(prev => ({
          ...prev,
          recipients: [...new Set([...prev.recipients, ...emails])]
        }));
      };
      reader.readAsText(file);
    } else {
      setConfig(prev => ({ ...prev, attachment: file }));
    }
  };

  const addCustomHeader = () => {
    if (headerKey.trim() && headerValue.trim() && !config.customHeaders[headerKey.trim()]) {
      setConfig(prev => ({
        ...prev,
        customHeaders: {
          ...prev.customHeaders,
          [headerKey.trim()]: headerValue.trim()
        }
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeCustomHeader = (key: string) => {
    setConfig(prev => {
      const newHeaders = { ...prev.customHeaders };
      delete newHeaders[key];
      return {
        ...prev,
        customHeaders: newHeaders
      };
    });
  };

  const validateConfiguration = () => {
    const errors = [];

    if (!config.server) errors.push("SMTP server is required");
    if (!config.subject) errors.push("Email subject is required");
    if (!config.message) errors.push("Email message is required");
    if (config.recipients.length === 0) errors.push("At least one recipient is required");
    
    if (config.threads < 1 || config.threads > 100) {
      errors.push("Number of threads must be between 1 and 100");
    }

    if (config.testMode === 'count') {
      if (!config.totalEmails || config.totalEmails < 1) {
        errors.push("Total emails must be at least 1 for count-based tests");
      }
    }

    if (config.testMode === 'duration') {
      if (!config.duration || config.duration < 1) {
        errors.push("Duration must be at least 1 second for time-based tests");
      }
    }

    return errors;
  };

  const handleStartTest = () => {
    const validationErrors = validateConfiguration();
    
    if (validationErrors.length > 0) {
      toast({
        title: "Configuration Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    onStartTest(config);
    toast({
      title: "Test Started",
      description: `Load test initiated with ${config.threads} threads and ${config.recipients.length} recipients in ${config.testMode} mode.`,
    });
  };

  const getEmailsPerThread = () => {
    if (config.testMode === 'count' && config.totalEmails) {
      return Math.ceil(config.totalEmails / config.threads);
    }
    return 'N/A';
  };

  const getEstimatedDuration = () => {
    if (config.testMode === 'count' && config.totalEmails) {
      const emailsPerThread = Math.ceil(config.totalEmails / config.threads);
      const totalTime = (emailsPerThread * config.delay) / 1000; // in seconds
      return `~${Math.round(totalTime)}s`;
    } else if (config.testMode === 'duration') {
      return `${config.duration}s`;
    }
    return 'Unlimited';
  };

  const getEstimatedEmailsForDuration = () => {
    if (config.testMode === 'duration' && config.duration) {
      const emailsPerSecond = config.delay > 0 ? 1000 / config.delay : 10;
      return Math.round(emailsPerSecond * config.threads * config.duration);
    }
    return 'N/A';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SMTP Server Configuration */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">SMTP Server</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Configure your SMTP server connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="server" className="text-slate-300">Server Address</Label>
              <Input
                id="server"
                value={config.server}
                onChange={(e) => handleInputChange('server', e.target.value)}
                placeholder="smtp.gmail.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="port" className="text-slate-300">Port</Label>
              <Select value={config.port} onValueChange={(value) => handleInputChange('port', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="25">25 (Standard)</SelectItem>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="2587">2587 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="fromEmail" className="text-slate-300">From Email Address</Label>
            <Input
              id="fromEmail"
              value={config.fromEmail}
              onChange={(e) => handleInputChange('fromEmail', e.target.value)}
              placeholder="sender@domain.com"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="useAuth"
              checked={config.useAuth}
              onCheckedChange={(checked) => handleInputChange('useAuth', checked)}
            />
            <Label htmlFor="useAuth" className="text-slate-300">Use Authentication</Label>
          </div>

          {config.useAuth && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="your-email@domain.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="useSSL"
              checked={config.useSSL}
              onCheckedChange={(checked) => handleInputChange('useSSL', checked)}
            />
            <Lock className="w-4 h-4 text-slate-400" />
            <Label htmlFor="useSSL" className="text-slate-300">Use SSL/TLS</Label>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-400" />
            <CardTitle className="text-white">Email Content</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Configure the email content and attachments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject" className="text-slate-300">Subject</Label>
            <Input
              id="subject"
              value={config.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Load Test Email"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-slate-300">Message Body</Label>
            <Textarea
              id="message"
              value={config.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="This is a test email for load testing purposes..."
              rows={4}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="attachment" className="text-slate-300">Attachment (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={(e) => handleFileUpload(e, 'attachment')}
                className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
              />
              {config.attachment && (
                <Badge variant="secondary" className="bg-blue-600">
                  {config.attachment.name}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Custom Headers (Optional)</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="Header name (e.g., X-Priority)"
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Input
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="Header value"
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Button 
                  onClick={addCustomHeader} 
                  variant="outline" 
                  size="sm"
                  className="border-slate-600 px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {Object.entries(config.customHeaders).length > 0 && (
                <div className="max-h-24 overflow-y-auto">
                  <div className="space-y-1">
                    {Object.entries(config.customHeaders).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-slate-700 p-2 rounded text-sm">
                        <span className="text-slate-300">
                          <span className="font-medium text-white">{key}:</span> {value}
                        </span>
                        <Button
                          onClick={() => removeCustomHeader(key)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients Configuration */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Recipients</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Add recipients manually or upload from file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="Enter email address"
              onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button onClick={addRecipient} variant="outline" className="border-slate-600">
              Add
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-400" />
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFileUpload(e, 'recipients')}
              className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
            />
          </div>

          <div className="max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {config.recipients.map((email, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-slate-700 text-white cursor-pointer hover:bg-red-600"
                  onClick={() => removeRecipient(email)}
                >
                  {email} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Total Recipients: {config.recipients.length}
          </div>
        </CardContent>
      </Card>

      {/* Simplified Load Testing Parameters */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-white">Load Testing Parameters</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Configure the load testing behavior and execution mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Mode Dropdown */}
          <div>
            <Label className="text-slate-300">Test Mode</Label>
            <Select value={config.testMode} onValueChange={(value) => handleInputChange('testMode', value as 'count' | 'duration' | 'continuous')}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="count">Send a specific number of emails</SelectItem>
                <SelectItem value="duration">Run for a specific time</SelectItem>
                <SelectItem value="continuous">Run continuously until manually stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="threads" className="text-slate-300">Number of Threads</Label>
              <Input
                id="threads"
                type="number"
                min="1"
                max="100"
                value={config.threads}
                onChange={(e) => handleInputChange('threads', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Parallel workers sending emails
              </p>
            </div>
            <div>
              <Label htmlFor="delay" className="text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delay Between Emails (ms)
              </Label>
              <Input
                id="delay"
                type="number"
                min="0"
                value={config.delay}
                onChange={(e) => handleInputChange('delay', parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Wait time between each email per thread
              </p>
            </div>
          </div>

          {/* Conditional Inputs Based on Test Mode */}
          {config.testMode === 'count' && (
            <div>
              <Label htmlFor="totalEmails" className="text-slate-300">Total Emails to Send</Label>
              <Input
                id="totalEmails"
                type="number"
                min="1"
                value={config.totalEmails || ''}
                onChange={(e) => handleInputChange('totalEmails', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., 1000"
              />
              <p className="text-xs text-slate-400 mt-1">
                Emails per thread: {getEmailsPerThread()} | Estimated duration: {getEstimatedDuration()}
              </p>
            </div>
          )}

          {config.testMode === 'duration' && (
            <div>
              <Label htmlFor="duration" className="text-slate-300">Test Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={config.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., 300 (5 minutes)"
              />
              <p className="text-xs text-slate-400 mt-1">
                Estimated emails: ~{getEstimatedEmailsForDuration()} (based on delay and threads)
              </p>
            </div>
          )}

          {config.testMode === 'continuous' && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-800/30 rounded">
              <p className="text-yellow-300 text-sm">
                ⚠️ Continuous mode will run indefinitely until manually stopped. 
                Monitor your SMTP server limits and resources.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="pt-4 border-t border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-slate-300 text-sm">
              <div>
                <span className="text-slate-400">Test Mode:</span>
                <div className="font-semibold capitalize">{config.testMode}</div>
              </div>
              <div>
                <span className="text-slate-400">Threads:</span>
                <div className="font-semibold">{config.threads}</div>
              </div>
              <div>
                <span className="text-slate-400">Recipients:</span>
                <div className="font-semibold">{config.recipients.length}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleStartTest}
            disabled={testStatus === 'running'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {testStatus === 'running' ? 'Test Running...' : 'Start Load Test'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPConfiguration;
