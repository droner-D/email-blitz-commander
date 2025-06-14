import { SMTPTester } from '../smtp/SMTPTester';
import { SMTPConfig, TestResult } from '../types';
import { Database } from '../database/Database';
import { Server } from 'socket.io';

export class TestManager {
  private activeTests: Map<string, SMTPTester> = new Map();
  private db: Database;
  private io: Server;

  constructor(db: Database, io: Server) {
    this.db = db;
    this.io = io;
  }

  async startTest(config: SMTPConfig): Promise<string> {
    const tester = new SMTPTester(config);
    const testId = tester.getResult().id;

    // Store the test
    this.activeTests.set(testId, tester);

    // Set up event listeners
    tester.on('start', (result: TestResult) => {
      this.db.saveTestResult(result);
      this.io.emit('testStart', { testId, result });
    });

    tester.on('progress', (update) => {
      this.io.emit('testProgress', update);
      // Save progress periodically (every 10 updates to avoid too many DB writes)
      if (update.data.totalEmails % 10 === 0) {
        this.db.saveTestResult(update.data);
      }
    });

    tester.on('complete', (result: TestResult) => {
      this.db.saveTestResult(result);
      this.io.emit('testComplete', { testId, result });
      this.activeTests.delete(testId);
    });

    tester.on('error', (update) => {
      this.io.emit('testError', update);
    });

    tester.on('pause', (result: TestResult) => {
      this.db.saveTestResult(result);
      this.io.emit('testPause', { testId, result });
    });

    tester.on('resume', (result: TestResult) => {
      this.db.saveTestResult(result);
      this.io.emit('testResume', { testId, result });
    });

    // Start the test
    await tester.start();

    return testId;
  }

  async stopTest(testId: string): Promise<void> {
    const tester = this.activeTests.get(testId);
    if (tester) {
      tester.stop();
      this.activeTests.delete(testId);
    }
  }

  async pauseTest(testId: string): Promise<void> {
    const tester = this.activeTests.get(testId);
    if (tester) {
      tester.pause();
    }
  }

  async resumeTest(testId: string): Promise<void> {
    const tester = this.activeTests.get(testId);
    if (tester) {
      tester.resume();
    }
  }

  getActiveTests(): Array<{ testId: string; result: TestResult }> {
    const activeTests: Array<{ testId: string; result: TestResult }> = [];
    
    this.activeTests.forEach((tester, testId) => {
      activeTests.push({
        testId,
        result: tester.getResult()
      });
    });

    return activeTests;
  }

  async getTestResult(testId: string): Promise<TestResult | null> {
    // Check if test is still active
    const activeTester = this.activeTests.get(testId);
    if (activeTester) {
      return activeTester.getResult();
    }

    // Otherwise get from database
    return await this.db.getTestResult(testId);
  }

  stopAllTests(): void {
    this.activeTests.forEach((tester) => {
      tester.stop();
    });
    this.activeTests.clear();
  }
}
