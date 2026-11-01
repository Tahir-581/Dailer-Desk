import { XMLParser } from "fast-xml-parser";

export interface SitemapUrl {
  url: string;
  title?: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapUrlEntry {
  loc: string | string[];
  lastmod?: string | string[];
  changefreq?: string | string[];
  priority?: string | string[];
}

interface SitemapIndex {
  sitemapindex?: {
    sitemap?: SitemapUrlEntry | SitemapUrlEntry[];
  };
}

interface Sitemap {
  urlset?: {
    url?: SitemapUrlEntry | SitemapUrlEntry[];
  };
}


function getFirstValue<T>(value: T | T[] | undefined): T | undefined 
{
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}


function toArray<T>(value: T | T[] | undefined): T[] 
{
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseSitemap(sitemapXml: string): SitemapUrl[] 
{
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    trimValues: true,
  });

  try {
    const parsed = parser.parse(sitemapXml) as Sitemap | SitemapIndex;
    const urls: SitemapUrl[] = [];

    if ("sitemapindex" in parsed && parsed.sitemapindex?.sitemap) 
    {
      const sitemaps = toArray(parsed.sitemapindex.sitemap);

      for (const sitemap of sitemaps) 
      {
        const loc = getFirstValue(sitemap.loc);
        if (loc && typeof loc === "string") 
        {
          urls.push({ url: loc.trim(), lastmod: getFirstValue(sitemap.lastmod) });
        }
      }
      return urls;
    }

    if ("urlset" in parsed && parsed.urlset?.url) 
    {
      const entries = toArray(parsed.urlset.url);

      for (const entry of entries) 
      {
        const loc = getFirstValue(entry.loc);
        if (loc && typeof loc === "string") 
        {
          urls.push({ url: loc.trim(), lastmod: getFirstValue(entry.lastmod), changefreq: getFirstValue(entry.changefreq), priority: getFirstValue(entry.priority) });
        }
      }
    }

    return urls;
  } 
  
  catch (error) 
  {
    console.error("Error parsing sitemap:", error);
    throw new Error(`Failed to parse sitemap: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}


export async function fetchSitemap(sitemapUrl: string, timeout: number = 10000): Promise<SitemapUrl[]> {
  try 
  {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(sitemapUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; KBScraper/1.0)" } });

    clearTimeout(timeoutId);

    if (!response.ok) 
    {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    return parseSitemap(xml);
  } 
  
  catch (error) 
  {
    if (error instanceof Error && error.name === "AbortError") 
    {
      throw new Error("Sitemap fetch timeout");
    }

    throw error;
  }
}


export async function discoverSitemapUrl(baseUrl: string): Promise<string | null> 
{
  const base = new URL(baseUrl);
  const commonPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemaps.xml",
    "/sitemap1.xml",
  ];

  for (const path of commonPaths) 
  {
    try 
    {
      const sitemapUrl = new URL(path, base.origin).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(sitemapUrl, { signal: controller.signal, method: "HEAD", headers: { "User-Agent": "Mozilla/5.0 (compatible; KBScraper/1.0)" } });

      clearTimeout(timeoutId);

      if (response.ok) 
      {
        return sitemapUrl;
      }
    } 
    
    catch (error) 
    {
      continue;
    }
  }
  return null;
}


function normalizeUrl(url: string): string 
{
  try 
  {
    const urlObj = new URL(url);
    if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) 
    {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } 
  
  catch (error) 
  {
    throw new Error(`Invalid URL: ${url}`);
  }
}


export function filterUrls(urls: SitemapUrl[], baseUrl?: string): SitemapUrl[] 
{
  const seen = new Set<string>();
  const filtered: SitemapUrl[] = [];

  for (const item of urls) 
  {
    try 
    {
      const normalized = normalizeUrl(item.url);
      
      if (baseUrl) 
      {
        const base = new URL(baseUrl);
        const url = new URL(normalized);

        if (base.origin !== url.origin) 
        {
          continue;
        }
      }

      if (!seen.has(normalized)) 
      {
        seen.add(normalized);
        filtered.push({ ...item, url: normalized });
      }
    } 
    
    catch (error) 
    {
      continue;
    }
  }

  return filtered;
}