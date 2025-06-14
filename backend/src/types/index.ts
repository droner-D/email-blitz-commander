
export interface SMTPConfig {
  id?: string;
  server: string;
  port: number;
  username?: string;
  password?: string;
  fromEmail?: string;
  useAuth: boolean;
  useSSL: boolean;
  subject: string;
  message: string;
  recipients: string[];
  threads: number;
  emailsPerThread?: number;
  delay: number;
  attachmentPath?: string;
  customHeaders?: { [key: string]: string };
  testMode: 'count' | 'duration' | 'continuous';
  totalEmails?: number;
  duration?: number;
}

export interface TestResult {
  id: string;
  configId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  totalEmails: number;
  sentSuccessfully: number;
  failed: number;
  emailsPerSecond: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  errors: ErrorLog[];
  smtpResponses: SMTPResponse[];
}

export interface ErrorLog {
  timestamp: Date;
  error: string;
  recipient: string;
  thread: number;
}

export interface SMTPResponse {
  timestamp: Date;
  response: string;
  status: 'success' | 'error';
  recipient: string;
  responseTime: number;
}

export interface ThreadResult {
  threadId: number;
  sent: number;
  failed: number;
  avgResponseTime: number;
  errors: ErrorLog[];
}

export interface RealTimeUpdate {
  testId: string;
  type: 'progress' | 'completion' | 'error' | 'smtp_response';
  data: any;
  timestamp: Date;
}
