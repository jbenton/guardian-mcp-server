import { GuardianClient } from '../api/guardian-client.js';
import { SearchByLengthParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

export async function guardianSearchByLength(client: GuardianClient, args: any): Promise<string> {
  const params = SearchByLengthParamsSchema.parse(args);

  // Build search parameters
  const searchParams: Record<string, any> = {
    'show-fields': 'headline,standfirst,byline,publication,firstPublicationDate,wordcount',
    'order-by': params.order_by || 'newest',
    'page-size': Math.min(params.page_size || 20, 200) // Get max for filtering
  };

  if (params.query) {
    searchParams.q = params.query;
  }
  if (params.section) {
    searchParams.section = params.section;
  }
  if (params.from_date) {
    const fromDate = validateDate(params.from_date);
    if (!fromDate) {
      throw new Error(`Invalid from_date format: ${params.from_date}. Use YYYY-MM-DD format.`);
    }
    searchParams['from-date'] = fromDate;
  }
  if (params.to_date) {
    const toDate = validateDate(params.to_date);
    if (!toDate) {
      throw new Error(`Invalid to_date format: ${params.to_date}. Use YYYY-MM-DD format.`);
    }
    searchParams['to-date'] = toDate;
  }

  const response = await client.search(searchParams);
  const articles = response.response.results;

  // Filter by word count
  const minWords = params.min_words || 0;
  const maxWords = params.max_words || Number.POSITIVE_INFINITY;

  const filteredArticles = articles.filter(article => {
    const wordCount = article.fields?.wordcount;
    if (wordCount && !isNaN(Number(wordCount))) {
      const count = Number(wordCount);
      return count >= minWords && count <= maxWords;
    }
    return false;
  });

  if (filteredArticles.length > 0) {
    const maxWordsDisplay = maxWords === Number.POSITIVE_INFINITY ? '∞' : maxWords.toString();
    let result = `Found ${filteredArticles.length} article(s) with ${minWords}-${maxWordsDisplay} words:\n\n`;

    filteredArticles.forEach((article, index) => {
      result += `**${index + 1}. ${article.webTitle || 'Untitled'}**\n`;

      if (article.fields) {
        const { fields } = article;
        
        if (fields.byline) {
          result += `By: ${fields.byline}\n`;
        }
        
        if (fields.firstPublicationDate) {
          const pubDate = fields.firstPublicationDate.substring(0, 10);
          result += `Published: ${pubDate}\n`;
        }
        
        if (fields.wordcount) {
          result += `Word count: ${fields.wordcount}\n`;
        }
        
        if (fields.standfirst) {
          result += `Summary: ${fields.standfirst}\n`;
        }
      }

      result += `Section: ${article.sectionName || 'Unknown'}\n`;
      result += `URL: ${article.webUrl || 'N/A'}\n\n`;
    });

    return result;
  } else {
    const maxWordsDisplay = maxWords === Number.POSITIVE_INFINITY ? '∞' : maxWords.toString();
    return `No articles found with word count between ${minWords} and ${maxWordsDisplay} words.`;
  }
}