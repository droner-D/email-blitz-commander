
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { SMTPConfig, TestResult } from '../types';

export class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath: string = './data/smtp_tester.db') {
    this.dbPath = dbPath;
    this.ensureDirectoryExists();
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async initializeTables() {
    const createTables = `
      CREATE TABLE IF NOT EXISTS smtp_configs (
        id TEXT PRIMARY KEY,
        server TEXT NOT NULL,
        port INTEGER NOT NULL,
        username TEXT,
        password TEXT,
        useAuth BOOLEAN NOT NULL,
        useSSL BOOLEAN NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        recipients TEXT NOT NULL,
        threads INTEGER NOT NULL,
        emailsPerThread INTEGER NOT NULL,
        delay INTEGER NOT NULL,
        attachmentPath TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        configId TEXT NOT NULL,
        status TEXT NOT NULL,
        startTime DATETIME NOT NULL,
        endTime DATETIME,
        totalEmails INTEGER DEFAULT 0,
        sentSuccessfully INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        emailsPerSecond REAL DEFAULT 0,
        avgResponseTime REAL DEFAULT 0,
        maxResponseTime REAL DEFAULT 0,
        minResponseTime REAL DEFAULT 0,
        errors TEXT DEFAULT '[]',
        smtpResponses TEXT DEFAULT '[]',
        FOREIGN KEY (configId) REFERENCES smtp_configs (id)
      );
    `;

    return new Promise<void>((resolve, reject) => {
      this.db.exec(createTables, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveConfig(config: SMTPConfig): Promise<string> {
    const id = config.id || require('uuid').v4();
    const sql = `
      INSERT OR REPLACE INTO smtp_configs 
      (id, server, port, username, password, useAuth, useSSL, subject, message, recipients, threads, emailsPerThread, delay, attachmentPath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        id, config.server, config.port, config.username, config.password,
        config.useAuth, config.useSSL, config.subject, config.message,
        JSON.stringify(config.recipients), config.threads, config.emailsPerThread,
        config.delay, config.attachmentPath
      ], function(err) {
        if (err) reject(err);
        else resolve(id);
      });
    });
  }

  async getConfigs(): Promise<SMTPConfig[]> {
    const sql = 'SELECT * FROM smtp_configs ORDER BY createdAt DESC';
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const configs = rows.map(row => ({
            ...row,
            recipients: JSON.parse(row.recipients)
          }));
          resolve(configs);
        }
      });
    });
  }

  async saveTestResult(result: TestResult): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO test_results 
      (id, configId, status, startTime, endTime, totalEmails, sentSuccessfully, failed, 
       emailsPerSecond, avgResponseTime, maxResponseTime, minResponseTime, errors, smtpResponses)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        result.id, result.configId, result.status, result.startTime.toISOString(),
        result.endTime?.toISOString(), result.totalEmails, result.sentSuccessfully,
        result.failed, result.emailsPerSecond, result.avgResponseTime,
        result.maxResponseTime, result.minResponseTime,
        JSON.stringify(result.errors), JSON.stringify(result.smtpResponses)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getTestResults(limit: number = 50): Promise<TestResult[]> {
    const sql = 'SELECT * FROM test_results ORDER BY startTime DESC LIMIT ?';
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const results = rows.map(row => ({
            ...row,
            startTime: new Date(row.startTime),
            endTime: row.endTime ? new Date(row.endTime) : undefined,
            errors: JSON.parse(row.errors || '[]'),
            smtpResponses: JSON.parse(row.smtpResponses || '[]')
          }));
          resolve(results);
        }
      });
    });
  }

  async getTestResult(id: string): Promise<TestResult | null> {
    const sql = 'SELECT * FROM test_results WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const result = {
            ...row,
            startTime: new Date(row.startTime),
            endTime: row.endTime ? new Date(row.endTime) : undefined,
            errors: JSON.parse(row.errors || '[]'),
            smtpResponses: JSON.parse(row.smtpResponses || '[]')
          };
          resolve(result);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
