import { GuardianArticle, GuardianResponse, GuardianTag, GuardianSection } from '../types/guardian.js';

export function formatArticleResponse(
  articles: GuardianArticle[],
  pagination?: GuardianResponse<any>,
  options?: { truncate?: boolean; maxLength?: number; showTags?: boolean }
): string {
  if (!articles || articles.length === 0) {
    return 'No articles found matching your criteria.';
  }

  let result = `Found ${articles.length} article(s):\n\n`;

  articles.forEach((article, index) => {
    result += `**${index + 1}. ${article.webTitle || 'Untitled'}**\n`;

    if (article.fields) {
      const { fields } = article;
      
      if (fields.byline) {
        result += `By: ${fields.byline}\n`;
      }
      
      if (fields.firstPublicationDate) {
        const pubDate = fields.firstPublicationDate.substring(0, 10); // Extract date part
        result += `Published: ${pubDate}\n`;
      }
      
      if (fields.standfirst) {
        result += `Summary: ${fields.standfirst}\n`;
      }
    }

    result += `Section: ${article.sectionName || 'Unknown'}\n`;
    result += `URL: ${article.webUrl || 'N/A'}\n`;
    result += `Guardian ID: ${article.id || 'N/A'}\n`;

    // Add tags if available and requested
    if (options?.showTags && article.tags && article.tags.length > 0) {
      const tags = article.tags.slice(0, 10).map(tag => tag.webTitle).join(', ');
      result += `Tags: ${tags}${article.tags.length > 10 ? ' (+' + (article.tags.length - 10) + ' more)' : ''}\n`;
    }

    if (article.fields?.body) {
      // Remove HTML tags
      let body = article.fields.body.replace(/<[^>]+>/g, '');
      
      // Apply truncation only if requested (default: no truncation for v2.0)
      const shouldTruncate = options?.truncate ?? false;
      const maxLength = options?.maxLength ?? 500;
      
      if (shouldTruncate && body.length > maxLength) {
        body = body.substring(0, maxLength) + '...';
        result += `Content preview: ${body}\n`;
      } else {
        result += `Content: ${body}\n`;
      }
    }

    result += '\n';
  });

  if (pagination && pagination.pages > 1) {
    result += `\nPagination: Page ${pagination.currentPage} of ${pagination.pages}\n`;
    if (pagination.currentPage < pagination.pages) {
      result += "Use the 'page' parameter to get more results.\n";
    }
  }

  return result;
}

export function formatTagsResponse(
  tags: GuardianTag[],
  query: string,
  pagination?: GuardianResponse<any>
): string {
  if (!tags || tags.length === 0) {
    return `No tags found matching '${query}'.`;
  }

  let result = `Found ${tags.length} tag(s) matching '${query}':\n\n`;

  tags.forEach((tag, index) => {
    result += `**${index + 1}. ${tag.webTitle || 'Unknown'}**\n`;
    result += `ID: ${tag.id || 'N/A'}\n`;
    result += `Type: ${tag.type || 'N/A'}\n`;
    result += `URL: ${tag.webUrl || 'N/A'}\n\n`;
  });

  if (pagination && pagination.pages > 1) {
    result += `\nPagination: Page ${pagination.currentPage} of ${pagination.pages}\n`;
  }

  return result;
}

export function formatSectionsResponse(sections: GuardianSection[]): string {
  if (!sections || sections.length === 0) {
    return 'No sections found.';
  }

  let result = 'Available Guardian sections:\n\n';

  sections.forEach((section) => {
    result += `**${section.webTitle || 'Unknown'}**\n`;
    result += `ID: ${section.id || 'N/A'}\n`;
    result += `URL: ${section.webUrl || 'N/A'}\n\n`;
  });

  return result;
}

export function validateDate(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  try {
    // Try parsing common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    ];

    for (const format of formats) {
      if (format.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().substring(0, 10);
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function calculateDateFromDaysBack(daysBack: number): string {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysBack);
  return targetDate.toISOString().substring(0, 10);
}

export function parseGuardianUrl(articleIdOrUrl: string): string {
  // If it's already an article ID (no protocol), return as-is
  if (!articleIdOrUrl.startsWith('http')) {
    return articleIdOrUrl;
  }
  
  // Parse Guardian URL to extract article ID
  try {
    const url = new URL(articleIdOrUrl);
    if (url.hostname === 'www.theguardian.com' || url.hostname === 'theguardian.com') {
      // Remove leading slash and return the path as article ID
      return url.pathname.substring(1);
    }
  } catch (error) {
    // If URL parsing fails, try string replacement as fallback
    return articleIdOrUrl.replace(/https?:\/\/(www\.)?theguardian\.com\//, '');
  }
  
  // If not a Guardian URL, return as-is
  return articleIdOrUrl;
}