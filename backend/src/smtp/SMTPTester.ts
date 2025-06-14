
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
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 100; // Increased threshold to prevent premature stopping

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
    // Only stop for critical errors, not for individual email failures
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      console.log(`Stopping test due to ${this.consecutiveErrors} consecutive errors - server may be down`);
      return true;
    }

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
    console.log(`Starting ${this.config.testMode} test with ${this.config.threads} threads`);
    
    if (this.config.testMode === 'count' && this.config.totalEmails) {
      await this.runCountBasedTest();
    } else if (this.config.testMode === 'duration') {
      await this.runDurationBasedTest();
    } else {
      await this.runContinuousTest();
    }

    if (this.isRunning) {
      this.complete();
    }
  }

  private async runCountBasedTest() {
    const totalEmails = this.config.totalEmails || 0;
    let emailsSent = 0;

    console.log(`Running count-based test: ${totalEmails} emails total`);

    while (emailsSent < totalEmails && this.isRunning) {
      for (const recipient of this.config.recipients) {
        if (emailsSent >= totalEmails || !this.isRunning) break;

        const threadIndex = emailsSent % this.config.threads;
        this.threads[threadIndex].queue.push({ recipient });
        emailsSent++;
      }
    }

    await this.waitForThreadsToComplete();
    console.log(`Count-based test completed: ${this.result.totalEmails} emails processed`);
  }

  private async runDurationBasedTest() {
    const endTime = this.endTime!;
    console.log(`Running duration-based test for ${this.config.duration} seconds`);
    
    while (Date.now() < endTime.getTime() && this.isRunning) {
      for (const recipient of this.config.recipients) {
        if (Date.now() >= endTime.getTime() || !this.isRunning) break;

        const threadIndex = this.result.totalEmails % this.config.threads;
        this.threads[threadIndex].queue.push({ recipient });
      }
      
      // Small delay to prevent overwhelming the queue
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    await this.waitForThreadsToComplete();
    console.log(`Duration-based test completed: ${this.result.totalEmails} emails processed`);
  }

  private async runContinuousTest() {
    console.log('Running continuous test - will run until manually stopped');
    let emailIndex = 0;

    while (this.isRunning) {
      const recipient = this.config.recipients[emailIndex % this.config.recipients.length];
      const threadIndex = this.result.totalEmails % this.config.threads;
      
      this.threads[threadIndex].queue.push({ recipient });
      emailIndex++;

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await this.waitForThreadsToComplete();
    console.log(`Continuous test stopped: ${this.result.totalEmails} emails processed`);
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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
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

      // Add custom headers if provided
      if (this.config.customHeaders && Object.keys(this.config.customHeaders).length > 0) {
        mailOptions.headers = this.config.customHeaders;
      }

      if (this.config.attachmentPath) {
        mailOptions.attachments = [{
          path: this.config.attachmentPath
        }];
      }

      const info = await transporter.sendMail(mailOptions);
      const responseTime = Date.now() - sendStartTime;

      // Reset consecutive errors on success
      this.consecutiveErrors = 0;

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
      this.consecutiveErrors++;
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

    // Emit error but continue the test
    this.emit('error', {
      testId: this.result.id,
      type: 'error',
      data: errorLog,
      timestamp: new Date()
    });

    // Only log warning for consecutive errors, don't stop unless critical
    if (this.consecutiveErrors > 10) {
      console.log(`Warning: ${this.consecutiveErrors} consecutive errors. Current error for ${recipient}: ${error.message}`);
    }
  }

  private keepRecentResponses() {
    if (this.result.smtpResponses.length > 100) {
      this.result.smtpResponses = this.result.smtpResponses.slice(-100);
    }
    if (this.result.errors.length > 100) {
      this.result.errors = this.result.errors.slice(-100);
    }
  }

  private getProgressData() {
    const runtime = (Date.now() - this.startTime.getTime()) / 1000;
    const emailsPerSecond = runtime > 0 ? this.result.totalEmails / runtime : 0;

    let progress = 0;
    if (this.config.testMode === 'count' && this.config.totalEmails) {
      progress = Math.min((this.result.totalEmails / this.config.totalEmails) * 100, 100);
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
    console.log('Test paused');
    this.emit('pause', this.result);
  }

  resume(): void {
    this.isPaused = false;
    this.result.status = 'running';
    console.log('Test resumed');
    this.emit('resume', this.result);
  }

  stop(): void {
    this.isRunning = false;
    this.threads.forEach(thread => thread.queue.kill());
    console.log('Test stopped manually');
    this.complete();
  }

  private complete(): void {
    this.result.status = 'completed';
    this.result.endTime = new Date();
    
    const runtime = (this.result.endTime.getTime() - this.startTime.getTime()) / 1000;
    this.result.emailsPerSecond = runtime > 0 ? this.result.totalEmails / runtime : 0;

    console.log(`Test completed: ${this.result.totalEmails} emails sent, ${this.result.sentSuccessfully} successful, ${this.result.failed} failed`);
    this.emit('complete', this.result);
  }

  getResult(): TestResult {
    return { ...this.result };
  }
}
