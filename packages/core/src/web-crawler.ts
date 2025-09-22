import { chromium, Browser, Page } from 'playwright';
import { ApplicationConfig, CrawlResult, PageInfo, LinkInfo } from './types.js';
import { Logger } from './logger.js';

export class WebCrawler {
  private logger = new Logger('WebCrawler');
  private browser: Browser | null = null;

  async crawl(config: ApplicationConfig): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      await this.initializeBrowser();
      const visitedUrls = new Set<string>();
      const discoveredPages: PageInfo[] = [];
      const errors: string[] = [];

      // Start crawling from the base URL
      await this.crawlPage(
        config.url,
        config,
        visitedUrls,
        discoveredPages,
        errors,
        0,
        config.discoverySettings.maxDepth
      );

      return {
        pages: discoveredPages,
        apiEndpoints: [], // Will be populated by API scanner
        totalPagesFound: discoveredPages.length,
        analysisMetadata: {
          crawlDepth: config.discoverySettings.maxDepth,
          duration: Date.now() - startTime,
          errors
        }
      };

    } finally {
      await this.cleanup();
    }
  }

  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  private async crawlPage(
    url: string,
    config: ApplicationConfig,
    visited: Set<string>,
    discovered: PageInfo[],
    errors: string[],
    depth: number,
    maxDepth: number
  ): Promise<void> {
    if (depth > maxDepth || visited.has(url) || this.shouldExcludeUrl(url, config)) {
      return;
    }

    visited.add(url);
    this.logger.debug(`Crawling: ${url} (depth: ${depth})`);

    const page = await this.browser!.newPage();
    
    try {
      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: config.discoverySettings.timeout 
      });

      // Perform login if credentials provided and this is the first page
      if (depth === 0 && config.credentials) {
        await this.performLogin(page, config.credentials);
      }

      // Extract page information
      const pageInfo = await this.extractPageInfo(page, url);
      discovered.push(pageInfo);

      // Find internal links for further crawling
      const internalLinks = pageInfo.links
        .filter((link: LinkInfo) => this.isInternalLink(link.href, config.url))
        .map((link: LinkInfo) => link.href);

      // Recursively crawl internal links
      for (const link of internalLinks) {
        await this.crawlPage(link, config, visited, discovered, errors, depth + 1, maxDepth);
      }

    } catch (error) {
      const errorMsg = `Error crawling ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.warn(errorMsg);
      errors.push(errorMsg);
    } finally {
      await page.close();
    }
  }

  private async extractPageInfo(page: Page, _url: string): Promise<PageInfo> {
    return await page.evaluate(() => {
      const forms = Array.from(document.forms).map(form => ({
        action: form.action || window.location.href,
        method: form.method || 'GET',
        fields: Array.from(form.elements).map(element => {
          const el = element as HTMLInputElement;
          return {
            name: el.name || '',
            type: el.type || 'text',
            required: el.hasAttribute('required'),
            validation: el.pattern || ''
          };
        }).filter(field => field.name)
      }));

      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
        .map(btn => ({
          text: (btn.textContent || (btn as HTMLInputElement).value || '').trim(),
          id: btn.id,
          classes: btn.className
        }))
        .filter(btn => btn.text);

      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(link => ({
          href: (link as HTMLAnchorElement).href,
          text: (link.textContent || '').trim()
        }))
        .filter(link => link.href && !link.href.startsWith('javascript:'));

      return {
        url: window.location.href,
        title: document.title,
        forms,
        buttons,
        links,
        discoveredAt: new Date()
      };
    });
  }

  private async performLogin(page: Page, credentials: any): Promise<void> {
    // Basic login detection and execution
    try {
      // Look for common login form patterns
      const usernameSelector = await this.findLoginField(page, ['username', 'email', 'user']);
      const passwordSelector = await this.findLoginField(page, ['password', 'pass']);
      
      if (usernameSelector && passwordSelector && credentials.username && credentials.password) {
        this.logger.info('Attempting automatic login...');
        
        await page.fill(usernameSelector, credentials.username);
        await page.fill(passwordSelector, credentials.password);
        
        // Find and click login button
        const loginButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("sign in")').first();
        if (await loginButton.count() > 0) {
          await loginButton.click();
          await page.waitForLoadState('networkidle');
          this.logger.info('Login completed');
        }
      }
    } catch (error) {
      this.logger.warn(`Login attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findLoginField(page: Page, fieldNames: string[]): Promise<string | null> {
    for (const name of fieldNames) {
      const selectors = [
        `input[name*="${name}"]`,
        `input[id*="${name}"]`,
        `input[placeholder*="${name}"]`
      ];
      
      for (const selector of selectors) {
        if (await page.locator(selector).count() > 0) {
          return selector;
        }
      }
    }
    return null;
  }

  private shouldExcludeUrl(url: string, config: ApplicationConfig): boolean {
    return config.discoverySettings.excludePatterns.some((pattern: string) => 
      url.includes(pattern) || new RegExp(pattern).test(url)
    );
  }

  private isInternalLink(href: string, baseUrl: string): boolean {
    try {
      const link = new URL(href);
      const base = new URL(baseUrl);
      return link.hostname === base.hostname;
    } catch {
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}