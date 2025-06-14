import { TestResult } from '../../backend/src/types';

interface StoredTestResult extends TestResult {
  timestamp: string;
  server: string;
  port: string;
  subject: string;
}

class TestHistoryService {
  private readonly STORAGE_KEY = 'smtp_test_history';
  private readonly MAX_HISTORY_ITEMS = 50;

  saveTestResult(result: TestResult, config: any): void {
    try {
      const history = this.getTestHistory();
      
      const testRecord: StoredTestResult = {
        ...result,
        timestamp: new Date().toISOString(),
        server: config.server,
        port: config.port.toString(),
        subject: config.subject
      };

      history.unshift(testRecord);
      
      // Keep only the latest tests
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.splice(this.MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save test result:', error);
    }
  }

  getTestHistory(): StoredTestResult[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load test history:', error);
      return [];
    }
  }

  getTestById(testId: string): StoredTestResult | null {
    try {
      const history = this.getTestHistory();
      return history.find(test => test.id === testId) || null;
    } catch (error) {
      console.error('Failed to get test by ID:', error);
      return null;
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
}

export const testHistoryService = new TestHistoryService();
