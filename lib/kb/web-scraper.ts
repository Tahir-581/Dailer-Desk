import { load } from "cheerio";
import { fetchSitemap, discoverSitemapUrl, filterUrls, type SitemapUrl } from "./sitemap-parser";

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  description?: string;
  error?: string;
}


export function extractTextFromHTML(html: string): { title: string; content: string; description?: string } {
  const $ = load(html);

 
  $("script, style, noscript, iframe, embed, object, svg").remove();

 
  let title = "";
  const titleTag = $("title").first();
  if (titleTag.length) {
    title = titleTag.text().trim();
  } else {
    const ogTitle = $('meta[property="og:title"]').attr("content");
    if (ogTitle) {
      title = ogTitle.trim();
    }
  }


  let description: string | undefined;
  const metaDesc = $('meta[name="description"]').attr("content") || 
                   $('meta[property="og:description"]').attr("content");
  if (metaDesc) {
    description = metaDesc.trim();
  }


  let content = "";
  const mainSelectors = [ "main", "article", "[role= main]", ".content", "#content", ".post-content", ".entry-content" ];
 
  let mainElement = $("body");
  for (const selector of mainSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      mainElement = element;
      break;
    }
  }

  content = mainElement
    .find("p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((text) => text.length > 0)
    .join("\n\n");

  if (content.length < 100) 
  {
    content = mainElement.text().trim();
  }

  content = content
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return { title, content, description };
}

export async function fetchWebPage( url: string, timeout: number = 10000, retries: number = 2 ): Promise<ScrapedPage> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) 
  {
    try 
    {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KBScraper/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const { title, content, description } = extractTextFromHTML(html);

      if (!content || content.length < 10) {
        throw new Error("No meaningful content extracted from page");
      }

      return { url, title: title || new URL(url).pathname, content, description };
    } 
    
    catch (error) 
    {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) 
      {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  return { url, title: new URL(url).pathname, content: "", error: lastError?.message || "Failed to fetch page" };
}


export async function discoverSitemap(baseUrl: string): Promise<SitemapUrl[]> 
{
  try 
  {
    const sitemapUrl = await discoverSitemapUrl(baseUrl);
    
    if (sitemapUrl) 
    {
      const urls = await fetchSitemap(sitemapUrl);
      return filterUrls(urls, baseUrl);
    }

    return [{ url: baseUrl }];
  } 
  
  catch (error) 
  {
    console.error("Error discovering sitemap:", error);
    return [{ url: baseUrl }];
  }
}


export async function batchScrapeUrls( urls: string[], options: { maxConcurrent?: number; delay?: number; timeout?: number } = {} ): Promise<{ success: ScrapedPage[]; failed: Array<{ url: string; error: string }> }> 
{
  const { maxConcurrent = 5, delay = 500, timeout = 10000 } = options;
  const success: ScrapedPage[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (let i = 0; i < urls.length; i += maxConcurrent) 
  {
    const batch = urls.slice(i, i + maxConcurrent);
    
    const results = await Promise.allSettled( batch.map((url) => fetchWebPage(url, timeout)))

    for (let j = 0; j < results.length; j++) 
    {
      const result = results[j];
      const url = batch[j];

      if (result.status === "fulfilled") 
      {
        if (result.value.error) 
        {
          failed.push({ url, error: result.value.error });
        } 
        
        else 
        {
          success.push(result.value);
        }
      } 
      
      else 
      {
        failed.push({ url, error: result.reason?.message || "Unknown error" });
      }
    }

    if (i + maxConcurrent < urls.length) 
    {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success, failed };
}

