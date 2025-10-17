import { TestResult } from '@ai-testing-agent/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PerformanceMetrics, TestExecutionEvents, TestSummary } from './types.js';

export class TestResultHandler {
  private events: TestExecutionEvents = {};
  private results: TestResult[] = [];
  private startTime: Date = new Date();

  constructor(events: TestExecutionEvents = {}) {
    this.events = events;
  }

  /**
   * Process and enhance test result
   */
  processResult(result: TestResult): TestResult {
    // Add result to collection
    this.results.push(result);

    // Emit completion event
    if (this.events.onTestComplete) {
      this.events.onTestComplete(result.testCaseId, result);
    }

    // Emit failure event if test failed
    if (result.status === 'FAILED' && this.events.onTestFailure) {
      this.events.onTestFailure(result.testCaseId, result.error || 'Test failed');
    }

    // Enhance result with additional metadata
    const enhancedResult = {
      ...result,
      executedAt: new Date()
    };
    
    // Add browser info if available
    (enhancedResult as any).browserInfo = this.getBrowserInfo();
    
    return enhancedResult;
  }

  /**
   * Generate comprehensive test summary
   */
  generateSummary(results: TestResult[] = this.results): TestSummary {
    const endTime = new Date();
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);

    const summary: TestSummary = {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      skipped: results.filter(r => r.status === 'SKIPPED').length,
      flaky: results.filter(r => r.status === 'FLAKY').length,
      duration: totalDuration,
      startTime: this.startTime,
      endTime,
      environment: {
        browser: process.env.PLAYWRIGHT_BROWSER || 'chromium',
        version: process.env.PLAYWRIGHT_VERSION || 'unknown',
        platform: process.platform
      }
    };

    return summary;
  }

  /**
   * Export results to JSON format
   */
  async exportToJson(
    filePath: string, 
    results: TestResult[] = this.results
  ): Promise<void> {
    const summary = this.generateSummary(results);
    const reportData = {
      summary,
      results: results.map(result => this.formatResultForExport(result)),
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf-8');
  }

  /**
   * Export results to HTML report
   */
  async exportToHtml(
    filePath: string, 
    results: TestResult[] = this.results
  ): Promise<void> {
    const summary = this.generateSummary(results);
    const html = this.generateHtmlReport(summary, results);

    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, html, 'utf-8');
  }

  /**
   * Export results to JUnit XML format
   */
  async exportToJunit(
    filePath: string, 
    results: TestResult[] = this.results
  ): Promise<void> {
    const summary = this.generateSummary(results);
    const xml = this.generateJunitXml(summary, results);

    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, xml, 'utf-8');
  }

  /**
   * Get detailed failure analysis
   */
  getFailureAnalysis(results: TestResult[] = this.results): any {
    const failedResults = results.filter(r => r.status === 'FAILED');
    
    if (failedResults.length === 0) {
      return { hasFailures: false };
    }

    const errorPatterns = this.analyzeErrorPatterns(failedResults);
    const failedSteps = this.analyzeFailedSteps(failedResults);
    const commonElements = this.analyzeCommonElements(failedResults);

    return {
      hasFailures: true,
      totalFailures: failedResults.length,
      errorPatterns,
      failedSteps,
      commonElements,
      recommendations: this.generateRecommendations(errorPatterns, failedSteps)
    };
  }

  /**
   * Track performance metrics across tests
   */
  trackPerformanceMetrics(testId: string, metrics: PerformanceMetrics): void {
    // Store metrics for analysis
    const result = this.results.find(r => r.testCaseId === testId);
    if (result) {
      (result as any).performanceMetrics = metrics;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(results: TestResult[] = this.results): any {
    const resultsWithMetrics = results.filter(r => (r as any).performanceMetrics);
    
    if (resultsWithMetrics.length === 0) {
      return { hasMetrics: false };
    }

    const metrics = resultsWithMetrics.map(r => (r as any).performanceMetrics);
    
    return {
      hasMetrics: true,
      averageLoadTime: this.calculateAverage(metrics.map(m => m.navigation.loadEnd - m.navigation.loadStart)),
      averageDomContentLoaded: this.calculateAverage(metrics.map(m => m.navigation.domContentLoaded)),
      averageLcp: this.calculateAverage(metrics.map(m => m.coreWebVitals.lcp).filter(Boolean)),
      averageFid: this.calculateAverage(metrics.map(m => m.coreWebVitals.fid).filter(Boolean)),
      averageCls: this.calculateAverage(metrics.map(m => m.coreWebVitals.cls).filter(Boolean)),
      slowestTests: this.getTopNByMetric(resultsWithMetrics, 'loadTime', 5),
      resourceCounts: this.analyzeResourceUsage(metrics)
    };
  }

  /**
   * Clear all stored results
   */
  clearResults(): void {
    this.results = [];
    this.startTime = new Date();
  }

  /**
   * Set event handlers
   */
  setEventHandlers(events: TestExecutionEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Get all results
   */
  getAllResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Get results by status
   */
  getResultsByStatus(status: 'PASSED' | 'FAILED' | 'FLAKY' | 'SKIPPED'): TestResult[] {
    return this.results.filter(r => r.status === status);
  }

  // Private helper methods

  private getBrowserInfo(): any {
    return {
      name: process.env.PLAYWRIGHT_BROWSER || 'chromium',
      version: process.env.PLAYWRIGHT_VERSION || 'unknown',
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
    };
  }

  private formatResultForExport(result: TestResult): any {
    return {
      ...result,
      executedAt: result.executedAt.toISOString(),
      stepResults: result.stepResults?.map(step => ({
        ...step,
        formattedDuration: this.formatDuration(step.duration)
      })),
      formattedDuration: this.formatDuration(result.duration)
    };
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  private generateHtmlReport(summary: TestSummary, results: TestResult[]): string {
    const passRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(1) : '0';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; }
        .summary-card .value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .results-table th { background-color: #f8f9fa; font-weight: bold; }
        .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
        .status-passed { background-color: #28a745; }
        .status-failed { background-color: #dc3545; }
        .status-skipped { background-color: #ffc107; }
        .status-flaky { background-color: #fd7e14; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Execution Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Platform: ${summary.environment.platform} | Browser: ${summary.environment.browser}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${summary.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value passed">${summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value failed">${summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="value">${this.formatDuration(summary.duration)}</div>
            </div>
        </div>
        
        <h2>Test Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Test ID</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr>
                        <td>${result.testCaseId}</td>
                        <td><span class="status-badge status-${result.status.toLowerCase()}">${result.status}</span></td>
                        <td>${this.formatDuration(result.duration)}</td>
                        <td>${result.error || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  private generateJunitXml(summary: TestSummary, results: TestResult[]): string {
    const testCases = results.map(result => {
      let testCase = `<testcase name="${result.testCaseId}" time="${(result.duration / 1000).toFixed(3)}">`;
      
      if (result.status === 'FAILED') {
        testCase += `<failure message="${this.escapeXml(result.error || 'Test failed')}">${this.escapeXml(result.error || '')}</failure>`;
      } else if (result.status === 'SKIPPED') {
        testCase += '<skipped/>';
      }
      
      testCase += '</testcase>';
      return testCase;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="AI Testing Agent" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${(summary.duration / 1000).toFixed(3)}">
${testCases}
</testsuite>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private analyzeErrorPatterns(failedResults: TestResult[]): any {
    const errorCounts: Record<string, number> = {};
    
    failedResults.forEach(result => {
      if (result.error) {
        const errorType = this.extractErrorType(result.error);
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      }
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  private analyzeFailedSteps(failedResults: TestResult[]): any {
    const stepCounts: Record<number, number> = {};
    
    failedResults.forEach(result => {
      result.stepResults?.forEach(step => {
        if (step.status === 'FAILED') {
          stepCounts[step.step] = (stepCounts[step.step] || 0) + 1;
        }
      });
    });

    return Object.entries(stepCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([step, count]) => ({ step: parseInt(step), count }));
  }

  private analyzeCommonElements(_failedResults: TestResult[]): string[] {
    // This would analyze selectors or elements that commonly fail
    // For now, return empty array
    return [];
  }

  private extractErrorType(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('element not found')) return 'Element Not Found';
    if (error.includes('navigation')) return 'Navigation Error';
    if (error.includes('network')) return 'Network Error';
    return 'Other';
  }

  private generateRecommendations(errorPatterns: any[], failedSteps: any[]): string[] {
    const recommendations: string[] = [];
    
    if (errorPatterns.some(p => p.error === 'Timeout')) {
      recommendations.push('Consider increasing timeout values for slow-loading elements');
    }
    
    if (errorPatterns.some(p => p.error === 'Element Not Found')) {
      recommendations.push('Review element selectors for stability and uniqueness');
    }
    
    if (failedSteps.length > 0) {
      recommendations.push(`Step ${failedSteps[0].step} fails frequently - review test logic`);
    }
    
    return recommendations;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private getTopNByMetric(results: any[], metric: string, n: number): any[] {
    return results
      .sort((a, b) => (b.performanceMetrics?.[metric] || 0) - (a.performanceMetrics?.[metric] || 0))
      .slice(0, n)
      .map(r => ({ testId: r.testCaseId, value: r.performanceMetrics?.[metric] }));
  }

  private analyzeResourceUsage(metrics: PerformanceMetrics[]): any {
    const totalResources = metrics.reduce((sum, m) => sum + m.resources.length, 0);
    const avgResources = totalResources / metrics.length;
    
    return {
      average: Math.round(avgResources),
      total: totalResources
    };
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}
