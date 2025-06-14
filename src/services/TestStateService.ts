
import { TestResult } from '../../backend/src/types';

interface TestState {
  currentTest: TestResult | null;
  isActive: boolean;
  lastCompletedTest: TestResult | null;
}

class TestStateService {
  private state: TestState = {
    currentTest: null,
    isActive: false,
    lastCompletedTest: null
  };

  private listeners: Array<(state: TestState) => void> = [];

  getCurrentState(): TestState {
    return { ...this.state };
  }

  setCurrentTest(test: TestResult | null): void {
    this.state.currentTest = test;
    this.state.isActive = test ? test.status === 'running' : false;
    this.notifyListeners();
  }

  updateTestProgress(test: TestResult): void {
    this.state.currentTest = test;
    this.state.isActive = test.status === 'running';
    
    if (test.status === 'completed') {
      this.state.lastCompletedTest = test;
      this.state.isActive = false;
    }
    
    this.notifyListeners();
  }

  getLatestTestResults(): TestResult | null {
    return this.state.currentTest || this.state.lastCompletedTest;
  }

  subscribe(listener: (state: TestState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const testStateService = new TestStateService();
