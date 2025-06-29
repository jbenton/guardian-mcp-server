# Guardian MCP Server - Improvement Ideas

## Performance Optimizations

### 1. Default Field Optimization for Speed
**Issue**: Full metadata responses are causing slow token streaming in Claude  
**Solution**: Implement smart defaults for different use cases

**Proposal**:
```typescript
// Current behavior - always returns full details (slow)
guardian_search({query: "AI"})

// Proposed - fast defaults with optional override
guardian_search({
  query: "AI",
  detail_level: "minimal" | "standard" | "full"  // default: "minimal"
})

// Alternative simpler approach
guardian_search({
  query: "AI", 
  full_details: false  // default: false for speed
})
```

**Implementation Strategy**:
- **Browsing tools** (search, browse_section, lookback) → minimal fields by default
  - Default `show_fields`: `headline,sectionName,webPublicationDate`
- **Detail tools** (get_article) → full content as current
- **Override parameter** for when full details needed in search results

**Expected Benefits**:
- Faster token streaming in Claude interface
- Better user experience for headline browsing
- Maintain full functionality when details needed

### 2. Full Article Content Retrieval ⚠️ CRITICAL ISSUE
**Issue**: `guardian_get_article` is truncating body content even when full body field is requested  
**Current Behavior**: Returns "Content preview: [text]..." instead of complete article  
**Impact**: Users cannot read complete articles - core functionality is broken
**Solution**: Modify server to return untruncated full article text when specifically requested

**Real-world example**: User requested Margaret Sullivan's column, got only preview instead of full 801-word article

**Implementation**: 
- Remove or make optional the content truncation in article formatting
- Provide parameter to control truncation (e.g., `truncate: boolean`)
- Ensure `guardian_get_article` returns complete content by default
- This should be the TOP PRIORITY fix as it affects core reading functionality

### 3. Expose Article Tags for Better Analysis ⚠️ 
**Issue**: Guardian API returns tag data but MCP server doesn't expose it to users
**Current Behavior**: Related articles tool works but users can't see what tags are being matched
**Impact**: Users can't understand WHY articles are considered "similar" or do their own tag-based analysis

**Proposed Solution**:
- Add tags to article response formatting (when available from API)
- Show shared tags in `guardian_find_related` results  
- Consider new tool: `guardian_get_article_tags` for tag inspection
- Tags would help users understand Guardian's content organization

**Use Case**: User asks "what tags are on this article?" - currently impossible to answer

### 4. URL-to-Article-ID Conversion
**Issue**: Users have Guardian URLs but tools only accept article IDs
**Current Behavior**: Users must manually extract article ID from URL
**Simple Solution**: Parse URLs automatically in all article tools

**Implementation**: 
```typescript
// Convert: https://www.theguardian.com/world/2025/jun/22/hyper-realistic-dolls-brazil
// To: world/2025/jun/22/hyper-realistic-dolls-brazil
function parseGuardianUrl(url: string): string {
  return url.replace('https://www.theguardian.com/', '');
}
```

**Benefits**: Much better UX - users can paste URLs directly rather than manually parsing them

**Note**: Guardian API does have tag data (via `show-tags=all` parameter) but MCP only requests it for similarity analysis, not user display

### 3. Response Formatting - Preserve Original Headlines
**Issue**: Current response formatting could encourage paraphrasing rather than exact headline citation  
**Current Behavior**: Headlines are formatted as `**1. [Article Title]**` which works well  
**Enhancement**: Ensure response format emphasizes exact Guardian headlines over summaries

**Suggested Documentation/Examples**:
- Emphasize in README that responses contain exact Guardian headlines
- Include examples showing direct headline quotation vs paraphrasing
- Consider adding note in tool descriptions about preserving original headlines
- Response format is actually good - this is more about usage guidance

**Example Good Usage**:
```
Guardian Headlines:
1. "Keir Starmer backs US strike on Iran and calls for Tehran to return to talks"
2. "Trump's plan to ban US states from AI regulation will 'hold us back', says Microsoft science chief"
```

**Rather than**:
```
Top stories include Starmer supporting Iran strikes and Microsoft opposing Trump's AI plans...
```

### 4. Intelligent "Top Stories" Analysis by Date
**Issue**: Current date queries return chronologically recent articles, not editorially important ones  
**Real-world example**: Nov 6, 2000 returns football match reports first, Bush vs Gore election coverage buried at #35+
**Opportunity**: With 200+ articles per day, we could analyze ALL headlines and intelligently prioritize

**Proposed Implementation**:
```typescript
guardian_top_stories_by_date({
  date: "2000-11-06",
  story_count: 10  // how many top stories to return
})
```

**Algorithm could prioritize based on**:
- Section importance (World/Politics > Sports for major events)
- Story complexity/length indicators  
- Geographic relevance to major audiences
- Breaking news language patterns
- Cross-reference with known historical events

**Example Output**: For Nov 6, 2000 - prioritize Bush/Gore election coverage over routine football match reports

**Benefits**: 
- Much more useful for historical research
- Better represents actual editorial priorities
- Leverages LLM analysis capabilities
- Could identify significant stories human users might miss

### 5. Personalized Long Read Recommendations
**Opportunity**: LLMs can analyze user context and match it with Guardian's Long Read archive for intelligent recommendations
**Real-world example**: User building MCPs + interested in journalism → recommend MrBeast platform analysis, Guardian's Yugoslavia coverage meta-analysis, investigative methodology pieces

**Proposed Implementation**:
```typescript
guardian_recommend_longreads({
  count: 3,  // how many recommendations
  context?: string  // optional user context/interests
})
```

**Algorithm approach**:
- Fetch recent Long Reads (20-50 articles)
- Analyze user's conversation context, interests, profession
- Match article topics/themes to user profile
- Return personalized recommendations with explanations
- Include direct URLs for immediate reading

**User Experience**:
- "Give me some Guardian Long Reads" → personalized suggestions
- Explanations of why each piece was recommended
- Could learn from user feedback over time

**Benefits**: 
- Transforms browsing from random to targeted
- Surfaces high-quality journalism users might miss
- Leverages LLM's contextual understanding abilities
- Creates more engaging user experience than basic chronological lists

---

## Future Enhancement Ideas from Claude Code's Original Analysis

### 7. Enhanced Content Analysis Tools ⭐ HIGH PRIORITY
**Implementation Ready**: These leverage existing Guardian API data for significant analytical value

#### **`guardian_content_timeline`** - Track story development over time
```typescript
guardian_content_timeline({
  query: "climate change",  // or tag-based search
  from_date: "2023-01-01", 
  to_date: "2024-12-31",
  interval: "month"  // or "week", "day"
})
```

**Output**: Timeline showing article counts per period, major peaks, sample headlines from peak periods, story evolution analysis

#### **`guardian_author_profile`** - Comprehensive journalist analysis  
```typescript
guardian_author_profile({
  author: "Damian Carrington",
  analysis_period: "2024"
})
```

**Output**: Publishing stats, section coverage, top topics/tags, writing patterns, expertise areas, career analysis

#### **`guardian_topic_trends`** - Track topic popularity over time
```typescript
guardian_topic_trends({
  topics: ["artificial intelligence", "Bill Cassidy", "brexit"],  // supports both tags AND keywords/phrases
  from_date: "2020-01-01",
  to_date: "2024-12-31", 
  interval: "quarter"
})
```

**Key Feature**: Works with BOTH Guardian tags AND arbitrary keywords/phrases - much more flexible than tag-only approach
**Output**: Growth/decline trends, seasonal patterns, major spikes with explanations, comparative analysis across topics

### 8. Performance & Caching Optimizations ⭐ HIGH PRIORITY
**Response Caching System**:
- Cache sections/tags (rarely change)
- Cache common searches with TTL
- Intelligent cache invalidation

**Smart Rate Limiting**:
- Predictive rate limit warnings
- Automatic backoff and retry logic
- Usage analytics for optimization

**Batch Operations**:
- `guardian_bulk_articles` - Fetch multiple articles efficiently
- Optimize API usage for research workflows

### 9. Enhanced Output Formatting ⭐ MEDIUM PRIORITY
**Structured Responses**: Clear sections, better markdown formatting
**Configurable Verbosity**: Light/standard/detailed response modes
**Context-Aware Field Selection**: Auto-optimize fields based on query type

### 6. "Top Stories" vs "Latest Stories" 
**Issue**: Current searches return chronologically recent articles, not editorially important ones  
**Potential Solutions**:
- Multi-section sampling for front-page simulation
- Trending topic detection
- Social engagement metrics (if available via API)

### 5. Content Filtering Improvements
**Issue**: No current way to filter by article importance or type  
**Ideas**:
- Editorial prominence indicators
- Article type classification (breaking news, analysis, opinion)
- Reader engagement metrics

### 6. Response Format Optimization
**Issue**: Current verbose formatting might be causing streaming slowdown  
**Ideas**:
- Condensed response formats for different use cases
- Structured data vs prose formatting options
- Progressive disclosure patterns

---

## Technical Debt & Code Quality

### 5. Error Handling Enhancements
- More specific error messages for different API failures
- Graceful degradation for partial API outages
- Better rate limiting feedback

### 6. Caching Opportunities  
- Section lists (rarely change)
- Popular tag searches
- Recent search results (with TTL)

---

## User Experience Improvements

### 7. Search Result Relevance
- Better handling of "no results" scenarios
- Search suggestion system
- Query expansion for better matches

### 8. Date Handling
- More flexible date input formats
- Relative date shortcuts ("last week", "past month")
- Date validation with helpful error messages

---

## API Coverage Expansion

### 9. Missing Features
- Better author search implementation (currently limited)
- Word count filtering improvements (if API supports)
- Cross-reference capabilities between articles

### 10. Advanced Search Features
- Boolean search operators
- Phrase searching
- Proximity searches (if supported by Guardian API)

---

## Notes for Implementation Priority

**High Priority (Critical Functionality)**:
- Full article content retrieval (#2) - CRITICAL: Users can't read complete articles
- Default field optimization (#1) - Performance improvement

**Medium Priority (UX)**:  
- Top stories vs latest (#4)
- Response format optimization (#6)
- Preserve original headlines (#3)

**Low Priority (Enhancement)**:
- Everything else can be evaluated based on user feedback

---

## Testing Checklist for Changes

When implementing improvements:
- [ ] Test token streaming speed before/after
- [ ] Verify all existing functionality still works
- [ ] Test with various search result sizes
- [ ] Confirm API rate limits still respected
- [ ] Test error scenarios
- [ ] Validate against Guardian API documentation

---

*Created: June 22, 2025*  
*Last Updated: June 22, 2025*