import { GuardianClient } from '../api/guardian-client.js';
import { TopicTrendsParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

interface TopicTrendData {
  topic: string;
  periods: {
    period: string;
    count: number;
    percentage: number;
  }[];
  totalArticles: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendStrength: number;
}

export async function guardianTopicTrends(client: GuardianClient, args: any): Promise<string> {
  const params = TopicTrendsParamsSchema.parse(args);

  const fromDate = validateDate(params.from_date);
  const toDate = validateDate(params.to_date);
  
  if (!fromDate || !toDate) {
    throw new Error('Invalid date format. Use YYYY-MM-DD format.');
  }

  const interval = params.interval || 'quarter';
  
  // Generate time periods
  const periods = generateTimePeriods(fromDate, toDate, interval);
  
  let result = `Topic Trends Analysis (${fromDate} to ${toDate})\n`;
  result += `Comparing: ${params.topics.join(', ')}\n\n`;
  
  const topicData: TopicTrendData[] = [];
  
  // Analyze each topic
  for (const topic of params.topics) {
    const topicTrend: TopicTrendData = {
      topic: topic,
      periods: [],
      totalArticles: 0,
      trend: 'stable',
      trendStrength: 0
    };
    
    for (const period of periods) {
      const searchParams: Record<string, any> = {
        q: `"${topic}"`,
        'from-date': period.start,
        'to-date': period.end,
        'page-size': 1, // We only need the count
        'show-fields': 'headline'
      };
      
      try {
        const response = await client.search(searchParams);
        const count = response.response.total;
        
        topicTrend.periods.push({
          period: period.label,
          count: count,
          percentage: 0 // Will calculate after getting all data
        });
        
        topicTrend.totalArticles += count;
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        topicTrend.periods.push({
          period: period.label,
          count: 0,
          percentage: 0
        });
      }
    }
    
    // Calculate percentages and trend
    topicTrend.periods.forEach(p => {
      p.percentage = topicTrend.totalArticles > 0 ? (p.count / topicTrend.totalArticles) * 100 : 0;
    });
    
    topicTrend.trend = calculateTrend(topicTrend.periods.map(p => p.count));
    topicTrend.trendStrength = calculateTrendStrength(topicTrend.periods.map(p => p.count));
    
    topicData.push(topicTrend);
  }
  
  // Display overall statistics
  result += `**Overall Statistics**\n`;
  topicData.forEach(topic => {
    const trendIcon = getTrendIcon(topic.trend, topic.trendStrength);
    result += `• ${topic.topic}: ${topic.totalArticles} articles ${trendIcon}\n`;
  });
  result += '\n';
  
  // Show period-by-period breakdown
  result += `**Period Breakdown**\n`;
  periods.forEach((period, index) => {
    result += `\n**${period.label}**\n`;
    
    // Sort topics by count for this period
    const periodData = topicData
      .map(topic => ({
        topic: topic.topic,
        count: topic.periods[index].count
      }))
      .sort((a, b) => b.count - a.count);
    
    periodData.forEach((data, rank) => {
      const rankIcon = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '  ';
      result += `${rankIcon} ${data.topic}: ${data.count} articles\n`;
    });
  });
  
  // Comparative analysis
  result += `\n**Comparative Analysis**\n`;
  
  // Find the dominant topic
  const dominantTopic = topicData.reduce((prev, current) => 
    prev.totalArticles > current.totalArticles ? prev : current
  );
  result += `• Most Covered: "${dominantTopic.topic}" (${dominantTopic.totalArticles} articles)\n`;
  
  // Find the fastest growing
  const fastestGrowing = topicData
    .filter(t => t.trend === 'increasing')
    .sort((a, b) => b.trendStrength - a.trendStrength)[0];
  
  if (fastestGrowing) {
    result += `• Fastest Growing: "${fastestGrowing.topic}" (${fastestGrowing.trendStrength.toFixed(1)}% increase)\n`;
  }
  
  // Find correlations (topics that trend together)
  const correlations = findCorrelations(topicData);
  if (correlations.length > 0) {
    result += `• Correlated Topics: ${correlations.join(', ')}\n`;
  }
  
  // Seasonal patterns
  if (interval === 'quarter' || interval === 'month') {
    const seasonalInsights = analyzeSeasonalPatterns(topicData, interval);
    if (seasonalInsights) {
      result += `• Seasonal Pattern: ${seasonalInsights}\n`;
    }
  }
  
  return result;
}

interface TimePeriod {
  start: string;
  end: string;
  label: string;
}

function generateTimePeriods(fromDate: string, toDate: string, interval: string): TimePeriod[] {
  const periods: TimePeriod[] = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  let current = new Date(start);
  
  while (current <= end) {
    let periodEnd = new Date(current);
    let label = '';
    
    switch (interval) {
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
      case 'year':
        periodEnd = new Date(current.getFullYear(), 11, 31);
        if (periodEnd > end) periodEnd = new Date(end);
        label = current.getFullYear().toString();
        break;
    }
    
    periods.push({
      start: current.toISOString().substring(0, 10),
      end: periodEnd.toISOString().substring(0, 10),
      label: label
    });
    
    // Move to next period
    switch (interval) {
      case 'month':
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
        break;
      case 'quarter':
        current.setMonth(current.getMonth() + 3);
        current.setDate(1);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        current.setMonth(0);
        current.setDate(1);
        break;
    }
  }
  
  return periods;
}

function calculateTrend(counts: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
  if (counts.length < 3) return 'stable';
  
  const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
  const secondHalf = counts.slice(Math.floor(counts.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  
  // Check for volatility
  const variance = counts.reduce((acc, count) => {
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    return acc + Math.pow(count - avg, 2);
  }, 0) / counts.length;
  
  const stdDev = Math.sqrt(variance);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const coefficientOfVariation = avg > 0 ? stdDev / avg : 0;
  
  if (coefficientOfVariation > 0.5) return 'volatile';
  if (Math.abs(change) < 15) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

function calculateTrendStrength(counts: number[]): number {
  if (counts.length < 2) return 0;
  
  const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
  const secondHalf = counts.slice(Math.floor(counts.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
}

function getTrendIcon(trend: string, strength: number): string {
  switch (trend) {
    case 'increasing': return strength > 50 ? '📈⬆️' : '📈';
    case 'decreasing': return strength < -50 ? '📉⬇️' : '📉';
    case 'volatile': return '📊';
    default: return '➡️';
  }
}

function findCorrelations(topicData: TopicTrendData[]): string[] {
  const correlations: string[] = [];
  
  for (let i = 0; i < topicData.length; i++) {
    for (let j = i + 1; j < topicData.length; j++) {
      const topic1 = topicData[i];
      const topic2 = topicData[j];
      
      // Simple correlation: both increasing or both decreasing
      if ((topic1.trend === 'increasing' && topic2.trend === 'increasing') ||
          (topic1.trend === 'decreasing' && topic2.trend === 'decreasing')) {
        correlations.push(`${topic1.topic} & ${topic2.topic}`);
      }
    }
  }
  
  return correlations;
}

function analyzeSeasonalPatterns(topicData: TopicTrendData[], interval: string): string | null {
  // Simple seasonal analysis - could be enhanced
  if (interval === 'quarter') {
    // Check if Q4 generally has higher coverage (holiday/year-end stories)
    const q4Patterns = topicData.filter(topic => {
      const q4Periods = topic.periods.filter(p => p.period.includes('Q4'));
      const avgQ4 = q4Periods.reduce((sum, p) => sum + p.count, 0) / q4Periods.length;
      const overallAvg = topic.periods.reduce((sum, p) => sum + p.count, 0) / topic.periods.length;
      return avgQ4 > overallAvg * 1.2;
    });
    
    if (q4Patterns.length > 0) {
      return `${q4Patterns.map(t => t.topic).join(', ')} show higher Q4 coverage`;
    }
  }
  
  return null;
}