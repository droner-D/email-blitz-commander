import nodemailer from 'nodemailer';
import { SMTPConfig, TestResult, ErrorLog, SMTPResponse, ThreadResult } from '../types';
import { EventEmitter } from 'events';
import * as async from 'async';

export class SMTPTester extends EventEmitter {
  private config: SMTPConfig;
  private result: TestResult;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private startTime: Date;
  private threads: Array<{ id: number; queue: async.QueueObject<any> }> = [];
  private endTime?: Date;

  constructor(config: SMTPConfig) {
    super();
    this.config = config;
    this.result = {
      id: require('uuid').v4(),
      configId: config.id || '',
      status: 'running',
      startTime: new Date(),
      totalEmails: 0,
      sentSuccessfully: 0,
      failed: 0,
      emailsPerSecond: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      errors: [],
      smtpResponses: []
    };
    this.startTime = new Date();

    // Set end time for duration-based tests
    if (config.testMode === 'duration' && config.duration) {
      this.endTime = new Date(Date.now() + config.duration * 1000);
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.emit('start', this.result);

    try {
      await this.createTransporter();
      await this.initializeThreads();
      await this.startLoadTest();
    } catch (error) {
      this.handleError(error as Error, 'general');
    }
  }

  private async createTransporter() {
    const transportConfig: any = {
      host: this.config.server,
      port: this.config.port,
      secure: this.config.useSSL,
    };

    if (this.config.useAuth) {
      transportConfig.auth = {
        user: this.config.username,
        pass: this.config.password
      };
    }

    // Test connection
    const transporter = nodemailer.createTransporter(transportConfig);
    await transporter.verify();
  }

  private async initializeThreads() {
    for (let i = 0; i < this.config.threads; i++) {
      const queue = async.queue(async (task: any) => {
        if (!this.isRunning) return;
        
        while (this.isPaused && this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check if we should stop based on test mode
        if (this.shouldStopTest()) {
          return;
        }

        await this.sendEmail(task.recipient, i);
        
        if (this.config.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay));
        }
      }, 1);

      this.threads.push({ id: i, queue });
    }
  }

  private shouldStopTest(): boolean {
    if (this.config.testMode === 'count' && this.config.totalEmails) {
      return this.result.totalEmails >= this.config.totalEmails;
    }
    
    if (this.config.testMode === 'duration' && this.endTime) {
      return Date.now() >= this.endTime.getTime();
    }
    
    // For continuous mode, only stop when manually stopped
    return false;
  }

  private async startLoadTest() {
    if (this.config.testMode === 'count' && this.config.totalEmails) {
      // Send specific number of emails
      await this.runCountBasedTest();
    } else if (this.config.testMode === 'duration') {
      // Run for specific duration
      await this.runDurationBasedTest();
    } else {
      // Continuous mode
      await this.runContinuousTest();
    }

    if (this.isRunning) {
      this.complete();
    }
  }

  private async runCountBasedTest() {
    const totalEmails = this.config.totalEmails || 0;
    let emailsSent = 0;

    while (emailsSent < totalEmails && this.isRunning) {
      for (const recipient of this.config.recipients) {
        if (emailsSent >= totalEmails || !this.isRunning) break;

        const threadIndex = emailsSent % this.config.threads;
        this.threads[threadIndex].queue.push({ recipient });
        emailsSent++;
      }
    }

    // Wait for all threads to complete
    await this.waitForThreadsToComplete();
  }

  private async runDurationBasedTest() {
    const endTime = this.endTime!;
    
    while (Date.now() < endTime.getTime() && this.isRunning) {
      for (const recipient of this.config.recipients) {
        if (Date.now() >= endTime.getTime() || !this.isRunning) break;

        const threadIndex = this.result.totalEmails % this.config.threads;
        this.threads[threadIndex].queue.push({ recipient });
      }
    }

    // Wait for remaining emails to be sent
    await this.waitForThreadsToComplete();
  }

  private async runContinuousTest() {
    let emailIndex = 0;

    while (this.isRunning) {
      const recipient = this.config.recipients[emailIndex % this.config.recipients.length];
      const threadIndex = this.result.totalEmails % this.config.threads;
      
      this.threads[threadIndex].queue.push({ recipient });
      emailIndex++;

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    await this.waitForThreadsToComplete();
  }

  private async waitForThreadsToComplete() {
    await Promise.all(this.threads.map(thread => 
      new Promise<void>(resolve => {
        if (thread.queue.idle()) {
          resolve();
        } else {
          thread.queue.drain(() => resolve());
        }
      })
    ));
  }

  private async sendEmail(recipient: string, threadId: number): Promise<void> {
    const sendStartTime = Date.now();

    try {
      const transportConfig: any = {
        host: this.config.server,
        port: this.config.port,
        secure: this.config.useSSL,
      };

      if (this.config.useAuth) {
        transportConfig.auth = {
          user: this.config.username,
          pass: this.config.password
        };
      }

      const transporter = nodemailer.createTransporter(transportConfig);

      const fromEmail = this.config.fromEmail || this.config.username || 'test@example.com';

      const mailOptions: any = {
        from: fromEmail,
        to: recipient,
        subject: this.config.subject,
        text: this.config.message,
      };

      if (this.config.attachmentPath) {
        mailOptions.attachments = [{
          path: this.config.attachmentPath
        }];
      }

      const info = await transporter.sendMail(mailOptions);
      const responseTime = Date.now() - sendStartTime;

      this.result.sentSuccessfully++;
      this.result.totalEmails++;
      
      this.updateResponseTimes(responseTime);
      
      const smtpResponse: SMTPResponse = {
        timestamp: new Date(),
        response: info.response || 'Email sent successfully',
        status: 'success',
        recipient,
        responseTime
      };

      this.result.smtpResponses.push(smtpResponse);
      this.keepRecentResponses();

      this.emit('progress', {
        testId: this.result.id,
        type: 'progress',
        data: this.getProgressData(),
        timestamp: new Date()
      });

    } catch (error) {
      const responseTime = Date.now() - sendStartTime;
      this.handleError(error as Error, recipient, threadId, responseTime);
    }
  }

  private updateResponseTimes(responseTime: number) {
    if (this.result.minResponseTime === 0 || responseTime < this.result.minResponseTime) {
      this.result.minResponseTime = responseTime;
    }
    
    if (responseTime > this.result.maxResponseTime) {
      this.result.maxResponseTime = responseTime;
    }

    // Calculate running average
    const totalResponses = this.result.sentSuccessfully + this.result.failed;
    this.result.avgResponseTime = 
      (this.result.avgResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
  }

  private handleError(error: Error, recipient: string, threadId?: number, responseTime?: number) {
    this.result.failed++;
    this.result.totalEmails++;

    const errorLog: ErrorLog = {
      timestamp: new Date(),
      error: error.message,
      recipient,
      thread: threadId || 0
    };

    this.result.errors.push(errorLog);

    if (responseTime) {
      const smtpResponse: SMTPResponse = {
        timestamp: new Date(),
        response: error.message,
        status: 'error',
        recipient,
        responseTime
      };

      this.result.smtpResponses.push(smtpResponse);
      this.keepRecentResponses();
      this.updateResponseTimes(responseTime);
    }

    this.emit('error', {
      testId: this.result.id,
      type: 'error',
      data: errorLog,
      timestamp: new Date()
    });
  }

  private keepRecentResponses() {
    if (this.result.smtpResponses.length > 50) {
      this.result.smtpResponses = this.result.smtpResponses.slice(-50);
    }
    if (this.result.errors.length > 50) {
      this.result.errors = this.result.errors.slice(-50);
    }
  }

  private getProgressData() {
    const runtime = (Date.now() - this.startTime.getTime()) / 1000;
    const emailsPerSecond = runtime > 0 ? this.result.totalEmails / runtime : 0;

    let progress = 0;
    if (this.config.testMode === 'count' && this.config.totalEmails) {
      progress = (this.result.totalEmails / this.config.totalEmails) * 100;
    } else if (this.config.testMode === 'duration' && this.config.duration) {
      progress = Math.min((runtime / this.config.duration) * 100, 100);
    } else {
      progress = 0; // Continuous mode doesn't have progress
    }

    return {
      ...this.result,
      emailsPerSecond: Math.round(emailsPerSecond * 100) / 100,
      progress
    };
  }

  pause(): void {
    this.isPaused = true;
    this.result.status = 'paused';
    this.emit('pause', this.result);
  }

  resume(): void {
    this.isPaused = false;
    this.result.status = 'running';
    this.emit('resume', this.result);
  }

  stop(): void {
    this.isRunning = false;
    this.threads.forEach(thread => thread.queue.kill());
    this.complete();
  }

  private complete(): void {
    this.result.status = 'completed';
    this.result.endTime = new Date();
    
    const runtime = (this.result.endTime.getTime() - this.startTime.getTime()) / 1000;
    this.result.emailsPerSecond = runtime > 0 ? this.result.totalEmails / runtime : 0;

    this.emit('complete', this.result);
  }

  getResult(): TestResult {
    return { ...this.result };
  }
}
