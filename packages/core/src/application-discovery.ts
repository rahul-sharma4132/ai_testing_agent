import { ApplicationConfig, CrawlResult, Module } from './types.js';
import { Logger } from './logger.js';
import { WebCrawler } from './web-crawler.js';

export class ApplicationDiscovery {
  private logger = new Logger('ApplicationDiscovery');
  private webCrawler = new WebCrawler();

  async analyzeApplication(config: ApplicationConfig): Promise<{
    modules: Module[];
    crawlResult: CrawlResult;
    analysisId: string;
  }> {
    const analysisId = this.generateAnalysisId();
    this.logger.info(`Starting application analysis: ${config.url}`);

    try {
      // Step 1: Crawl the web application
      const crawlResult = await this.webCrawler.crawl(config);
      this.logger.info(`Crawling completed: ${crawlResult.pages.length} pages found`);

      // Step 2: Create basic modules from crawl results
      const modules = this.createBasicModules(crawlResult);
      this.logger.info(`Module identification completed: ${modules.length} modules identified`);

      return {
        modules,
        crawlResult,
        analysisId
      };

    } catch (error) {
      this.logger.error('Application analysis failed', error);
      throw error;
    }
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createBasicModules(crawlResult: CrawlResult): Module[] {
    // Create a basic module representing the web application
    const webModule: Module = {
      id: `web_module_${Date.now()}`,
      name: 'Web Application',
      type: 'frontend',
      endpoints: crawlResult.apiEndpoints,
      components: crawlResult.pages.flatMap(page => 
        page.forms.map(form => ({
          id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'form' as const,
          selector: `form[action="${form.action}"]`,
          attributes: { action: form.action, method: form.method },
          fields: form.fields
        }))
      ),
      dependencies: [],
      discoveredAt: new Date()
    };

    return [webModule];
  }
}