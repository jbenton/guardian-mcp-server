import { GuardianClient } from '../api/guardian-client.js';
import { ContentTimelineParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

interface TimelinePeriod {
  start: string;
  end: string;
  label: string;
}

interface TimelineData {
  period: string;
  count: number;
  sampleHeadlines: string[];
}

export async function guardianContentTimeline(client: GuardianClient, args: any): Promise<string> {
  const params = ContentTimelineParamsSchema.parse(args);

  const fromDate = validateDate(params.from_date);
  const toDate = validateDate(params.to_date);
  
  if (!fromDate || !toDate) {
    throw new Error('Invalid date format. Use YYYY-MM-DD format.');
  }

  const interval = params.interval || 'month';
  
  // Generate time periods based on interval
  const periods = generateTimePeriods(fromDate, toDate, interval);
  
  let result = `Content Timeline for "${params.query}" (${fromDate} to ${toDate}):\n\n`;
  
  const timelineData: TimelineData[] = [];
  let totalArticles = 0;
  
  // Analyze each time period
  for (const period of periods) {
    const searchParams: Record<string, any> = {
      q: params.query,
      'from-date': period.start,
      'to-date': period.end,
      'page-size': 10, // Get sample headlines
      'show-fields': 'headline,firstPublicationDate',
      'order-by': 'relevance'
    };
    
    if (params.section) {
      searchParams.section = params.section;
    }
    
    try {
      const response = await client.search(searchParams);
      const articles = response.response.results;
      const count = response.response.total;
      
      const sampleHeadlines = articles.slice(0, 3).map(article => article.webTitle || 'Untitled');
      
      timelineData.push({
        period: period.label,
        count: count,
        sampleHeadlines: sampleHeadlines
      });
      
      totalArticles += count;
      
      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      timelineData.push({
        period: period.label,
        count: 0,
        sampleHeadlines: []
      });
    }
  }
  
  // Find peak periods
  const maxCount = Math.max(...timelineData.map(d => d.count));
  const peakPeriods = timelineData.filter(d => d.count === maxCount && d.count > 0);
  
  // Display timeline results
  result += `**Total Articles**: ${totalArticles}\n`;
  result += `**Analysis Period**: ${timelineData.length} ${interval}${timelineData.length !== 1 ? 's' : ''}\n\n`;
  
  if (peakPeriods.length > 0) {
    result += `**Peak Coverage** (${maxCount} articles):\n`;
    peakPeriods.forEach(peak => {
      result += `• ${peak.period}\n`;
    });
    result += '\n';
  }
  
  result += `**Timeline Breakdown**:\n`;
  timelineData.forEach(data => {
    const intensity = data.count === 0 ? '○' : 
                     data.count < maxCount * 0.3 ? '●' :
                     data.count < maxCount * 0.7 ? '●●' : '●●●';
    
    result += `${intensity} **${data.period}**: ${data.count} articles\n`;
    
    if (data.sampleHeadlines.length > 0) {
      data.sampleHeadlines.forEach(headline => {
        result += `   • ${headline}\n`;
      });
    }
    result += '\n';
  });
  
  // Trend analysis
  if (timelineData.length >= 3) {
    const trend = analyzeTrend(timelineData);
    result += `**Trend Analysis**: ${trend}\n`;
  }
  
  return result;
}

function generateTimePeriods(fromDate: string, toDate: string, interval: string): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  let current = new Date(start);
  
  while (current <= end) {
    let periodEnd = new Date(current);
    let label = '';
    
    switch (interval) {
      case 'day':
        label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        break;
      case 'week':
        periodEnd.setDate(current.getDate() + 6);
        if (periodEnd > end) periodEnd = new Date(end);
        label = `Week of ${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        break;
      case 'month':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        if (periodEnd > end) periodEnd = new Date(end);
        label = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        break;
      case 'quarter':
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        periodEnd = new Date(current.getFullYear(), quarter * 3, 0);
        if (periodEnd > end) periodEnd = new Date(end);
        label = `Q${quarter} ${current.getFullYear()}`;
        break;
    }
    
    periods.push({
      start: current.toISOString().substring(0, 10),
      end: periodEnd.toISOString().substring(0, 10),
      label: label
    });
    
    // Move to next period
    switch (interval) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
        break;
      case 'quarter':
        current.setMonth(current.getMonth() + 3);
        current.setDate(1);
        break;
    }
  }
  
  return periods;
}

function analyzeTrend(data: TimelineData[]): string {
  const counts = data.map(d => d.count);
  const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
  const secondHalf = counts.slice(Math.floor(counts.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  if (Math.abs(change) < 10) {
    return 'Coverage remained relatively stable over time';
  } else if (change > 0) {
    return `Coverage increased by ${Math.round(change)}% over the period`;
  } else {
    return `Coverage decreased by ${Math.round(Math.abs(change))}% over the period`;
  }
}