import { GuardianClient } from '../api/guardian-client.js';
import { RecommendLongreadsParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

interface LongreadRecommendation {
  article: any;
  relevanceScore: number;
  reasons: string[];
  readingTime: string;
  topics: string[];
}

export async function guardianRecommendLongreads(client: GuardianClient, args: any): Promise<string> {
  const params = RecommendLongreadsParamsSchema.parse(args);

  const count = params.count || 3;
  const context = params.context || '';
  const topicPreference = params.topic_preference || '';
  
  // Determine date range for recommendations
  let fromDate: string;
  if (params.from_date) {
    fromDate = validateDate(params.from_date) || params.from_date;
  } else {
    // Default to last 3 months for fresh content
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    fromDate = date.toISOString().substring(0, 10);
  }

  // Search for Long Read articles
  const searchParams: Record<string, any> = {
    'tag': 'news/series/the-long-read',
    'from-date': fromDate,
    'page-size': 50, // Get a good selection for analysis
    'show-fields': 'headline,standfirst,byline,wordcount,firstPublicationDate,body',
    'show-tags': 'keyword,type,contributor',
    'order-by': 'newest'
  };

  const response = await client.search(searchParams);
  const longreads = response.response.results;

  if (longreads.length === 0) {
    return `No Long Read articles found since ${fromDate}. Try extending the date range.`;
  }

  // Analyze context to extract topics and preferences
  const contextAnalysis = analyzeContext(context, topicPreference);
  
  // Score and rank longreads based on relevance
  const recommendations = longreads
    .map(article => scoreLongread(article, contextAnalysis))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, count);

  // Format recommendations
  let result = `📚 **Curated Long Read Recommendations**\n`;
  result += `Based on: ${contextAnalysis.interests.length > 0 ? contextAnalysis.interests.join(', ') : 'diverse topics'}\n\n`;

  recommendations.forEach((rec, index) => {
    const article = rec.article;
    const rank = index + 1;
    
    result += `**${rank}. ${article.webTitle || 'Untitled'}**\n`;
    result += `${rec.readingTime} • Relevance: ${rec.relevanceScore.toFixed(1)}/100\n`;
    
    if (article.fields) {
      const { fields } = article;
      
      if (fields.byline) {
        result += `By: ${fields.byline}\n`;
      }
      
      if (fields.firstPublicationDate) {
        const pubDate = new Date(fields.firstPublicationDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        result += `Published: ${pubDate}\n`;
      }
      
      if (fields.standfirst) {
        result += `Summary: ${fields.standfirst}\n`;
      }
    }
    
    result += `Topics: ${rec.topics.join(', ')}\n`;
    result += `Why recommended: ${rec.reasons.join(', ')}\n`;
    result += `URL: ${article.webUrl || 'N/A'}\n`;
    result += `Guardian ID: ${article.id || 'N/A'}\n\n`;
  });

  // Add discovery suggestions
  result += `**Explore More**:\n`;
  result += `• Use guardian_longread with specific queries for targeted searches\n`;
  result += `• Try guardian_search_by_author with Long Read contributors\n`;
  
  const availableTopics = getPopularLongreadTopics(longreads);
  if (availableTopics.length > 0) {
    result += `• Popular Long Read topics: ${availableTopics.slice(0, 5).join(', ')}\n`;
  }

  return result;
}

interface ContextAnalysis {
  interests: string[];
  preferredTypes: string[];
  themes: string[];
}

function analyzeContext(context: string, topicPreference: string): ContextAnalysis {
  const analysis: ContextAnalysis = {
    interests: [],
    preferredTypes: [],
    themes: []
  };

  // Combine context and topic preference for analysis
  const fullText = `${context} ${topicPreference}`.toLowerCase();

  // Extract interests from common topics and keywords
  const topicKeywords = [
    { keywords: ['climate', 'environment', 'global warming', 'sustainability'], topic: 'Environment' },
    { keywords: ['politics', 'election', 'government', 'policy'], topic: 'Politics' },
    { keywords: ['technology', 'ai', 'artificial intelligence', 'digital', 'tech'], topic: 'Technology' },
    { keywords: ['economy', 'business', 'finance', 'market', 'money'], topic: 'Economics' },
    { keywords: ['health', 'medicine', 'pandemic', 'covid', 'mental health'], topic: 'Health' },
    { keywords: ['culture', 'art', 'music', 'film', 'literature', 'books'], topic: 'Culture' },
    { keywords: ['science', 'research', 'discovery', 'study'], topic: 'Science' },
    { keywords: ['society', 'social', 'community', 'inequality', 'justice'], topic: 'Society' },
    { keywords: ['travel', 'places', 'cities', 'countries', 'explore'], topic: 'Travel' },
    { keywords: ['sports', 'football', 'athletics', 'games'], topic: 'Sports' },
    { keywords: ['food', 'cooking', 'restaurants', 'cuisine'], topic: 'Food' },
    { keywords: ['war', 'conflict', 'international', 'world', 'global'], topic: 'World Affairs' },
    { keywords: ['personal', 'memoir', 'life', 'experience', 'story'], topic: 'Personal Stories' },
    { keywords: ['history', 'historical', 'past', 'archive'], topic: 'History' }
  ];

  for (const topicGroup of topicKeywords) {
    if (topicGroup.keywords.some(keyword => fullText.includes(keyword))) {
      analysis.interests.push(topicGroup.topic);
    }
  }

  // Extract content type preferences
  const typeKeywords = [
    { keywords: ['investigation', 'investigative', 'expose'], type: 'investigative' },
    { keywords: ['profile', 'biography', 'portrait'], type: 'profile' },
    { keywords: ['analysis', 'deep dive', 'explained'], type: 'analysis' },
    { keywords: ['narrative', 'story', 'tale'], type: 'narrative' },
    { keywords: ['review', 'opinion', 'commentary'], type: 'commentary' }
  ];

  for (const typeGroup of typeKeywords) {
    if (typeGroup.keywords.some(keyword => fullText.includes(keyword))) {
      analysis.preferredTypes.push(typeGroup.type);
    }
  }

  // Extract themes
  const themeKeywords = [
    { keywords: ['inspiring', 'hopeful', 'positive'], theme: 'uplifting' },
    { keywords: ['serious', 'important', 'critical'], theme: 'serious' },
    { keywords: ['fascinating', 'interesting', 'curious'], theme: 'intriguing' },
    { keywords: ['new', 'recent', 'current'], theme: 'contemporary' },
    { keywords: ['unusual', 'weird', 'strange', 'surprising'], theme: 'unusual' }
  ];

  for (const themeGroup of themeKeywords) {
    if (themeGroup.keywords.some(keyword => fullText.includes(keyword))) {
      analysis.themes.push(themeGroup.theme);
    }
  }

  // If no interests detected, add some popular defaults
  if (analysis.interests.length === 0) {
    analysis.interests = ['Culture', 'Society', 'World Affairs'];
  }

  return analysis;
}

function scoreLongread(article: any, contextAnalysis: ContextAnalysis): LongreadRecommendation {
  let score = 0;
  const reasons: string[] = [];
  const topics: string[] = [];

  // Base quality score for Long Reads
  score += 40; // All Long Reads have baseline quality

  // Analyze article tags for topic matching
  if (article.tags) {
    const articleTopics = article.tags
      .filter((tag: any) => tag.type === 'keyword')
      .map((tag: any) => tag.webTitle);

    topics.push(...articleTopics.slice(0, 4)); // Limit displayed topics

    // Score based on interest matching
    for (const interest of contextAnalysis.interests) {
      const matchingTags = articleTopics.filter((topic: string) =>
        topic.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(topic.toLowerCase())
      );
      
      if (matchingTags.length > 0) {
        score += 20;
        reasons.push(`matches ${interest.toLowerCase()}`);
      }
    }
  }

  // Headline and standfirst analysis
  const headline = article.webTitle?.toLowerCase() || '';
  const standfirst = article.fields?.standfirst?.toLowerCase() || '';
  const fullText = `${headline} ${standfirst}`;

  // Theme matching
  for (const theme of contextAnalysis.themes) {
    const themeWords = getThemeWords(theme);
    if (themeWords.some(word => fullText.includes(word))) {
      score += 15;
      reasons.push(`${theme} content`);
    }
  }

  // Content type analysis
  for (const type of contextAnalysis.preferredTypes) {
    const typeWords = getTypeWords(type);
    if (typeWords.some(word => fullText.includes(word))) {
      score += 18;
      reasons.push(`${type} style`);
    }
  }

  // Word count analysis
  const wordCount = article.fields?.wordcount ? parseInt(article.fields.wordcount) : 0;
  const readingTime = calculateReadingTime(wordCount);

  if (wordCount > 3000) {
    score += 10;
    reasons.push('comprehensive coverage');
  } else if (wordCount > 2000) {
    score += 8;
    reasons.push('detailed exploration');
  }

  // Recency bonus (fresher content is generally preferred)
  if (article.fields?.firstPublicationDate) {
    const pubDate = new Date(article.fields.firstPublicationDate);
    const daysSince = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      score += 12;
      reasons.push('recent publication');
    } else if (daysSince < 60) {
      score += 8;
      reasons.push('fairly recent');
    }
  }

  // Author recognition (some Long Read authors are particularly renowned)
  const byline = article.fields?.byline?.toLowerCase() || '';
  const prominentAuthors = ['john', 'rachel', 'david', 'sarah', 'michael', 'emma']; // Simplified check
  if (prominentAuthors.some(name => byline.includes(name))) {
    score += 8;
    reasons.push('acclaimed author');
  }

  // Ensure we have some reasons
  if (reasons.length === 0) {
    reasons.push('quality longform journalism');
  }

  // Limit score to 100
  score = Math.min(100, score);

  return {
    article,
    relevanceScore: score,
    reasons,
    readingTime,
    topics: topics.length > 0 ? topics : ['General Interest']
  };
}

function getThemeWords(theme: string): string[] {
  const themeWordMap: Record<string, string[]> = {
    'uplifting': ['hope', 'inspiring', 'positive', 'success', 'triumph', 'joy'],
    'serious': ['crisis', 'urgent', 'important', 'critical', 'severe', 'major'],
    'intriguing': ['mystery', 'fascinating', 'remarkable', 'extraordinary', 'unusual', 'curious'],
    'contemporary': ['new', 'modern', 'recent', 'current', 'today', 'now'],
    'unusual': ['strange', 'bizarre', 'weird', 'unexpected', 'surprising', 'odd']
  };
  
  return themeWordMap[theme] || [];
}

function getTypeWords(type: string): string[] {
  const typeWordMap: Record<string, string[]> = {
    'investigative': ['investigation', 'expose', 'reveals', 'uncovers', 'exclusive', 'probe'],
    'profile': ['profile', 'portrait', 'life', 'biography', 'story of', 'meet'],
    'analysis': ['analysis', 'explained', 'understanding', 'deep dive', 'breakdown', 'examine'],
    'narrative': ['story', 'tale', 'journey', 'adventure', 'experience', 'narrative'],
    'commentary': ['opinion', 'view', 'perspective', 'argues', 'believes', 'thinks']
  };
  
  return typeWordMap[type] || [];
}

function calculateReadingTime(wordCount: number): string {
  if (wordCount === 0) return 'Unknown length';
  
  const wordsPerMinute = 250; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (minutes < 60) {
    return `${minutes} min read`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m read`;
  }
}

function getPopularLongreadTopics(longreads: any[]): string[] {
  const topicCounts: Record<string, number> = {};
  
  longreads.forEach(article => {
    if (article.tags) {
      article.tags
        .filter((tag: any) => tag.type === 'keyword')
        .forEach((tag: any) => {
          const topic = tag.webTitle;
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
    }
  });

  return Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([topic]) => topic)
    .slice(0, 10);
}