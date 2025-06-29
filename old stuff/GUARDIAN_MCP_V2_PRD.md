# Guardian MCP Server v2.0 - Product Requirements Document

**Project**: Guardian MCP Server TypeScript Enhancement  
**Version**: v2.0  
**Date**: June 22, 2025  
**Status**: Ready for Implementation

---

## 🎯 **Executive Summary**

Guardian MCP v1.0 successfully provides access to The Guardian's 25+ year archive with 10 working tools. v2.0 focuses on **critical functionality fixes** and **high-value analytical features** that transform the MCP from a search interface into a research analysis platform.

**Success Metrics**: Full article reading + 3 new analytical tools + 50%+ faster browsing

---

## 🚨 **CRITICAL FIXES (Must-Have)**

### **1. Full Article Content Retrieval - URGENT**
**Issue**: Users cannot read complete articles - core functionality broken  
**Current**: `guardian_get_article` returns truncated previews instead of full text  
**Root Cause**: Response formatting truncates content even when full `body` field requested

**Implementation**:
- Remove content truncation in article formatting logic
- Add optional `truncate: boolean` parameter (default: false)
- Ensure complete article text returned for `guardian_get_article`

**Test Case**: Margaret Sullivan column should return full 801 words, not preview

### **2. Performance Optimization - Speed**
**Issue**: Slow token streaming during headline browsing (30% slower than normal)  
**Root Cause**: Verbose metadata responses with unnecessary fields

**Implementation**:
```typescript
// Default to minimal fields for browsing
guardian_search({
  query: "AI",
  detail_level: "minimal" | "standard" | "full"  // default: "minimal"
})
```

**Field Strategy**:
- **Browsing tools**: `headline,sectionName,webPublicationDate` (fast)
- **Detail tools**: Full content (current behavior)
- **Override option**: Allow full details when needed

### **3. Tag Visibility & Analysis**
**Issue**: Users can't see article tags or understand similarity matching  
**Discovery**: API has rich tag data via `show-tags=all` but MCP doesn't expose it

**Implementation**:
- Add tags to article responses when available
- Show shared tags in `guardian_find_related` results
- New tool: `guardian_get_article_tags` for tag inspection

### **4. URL Input Support**
**Issue**: Users have Guardian URLs but must manually extract article IDs  
**Solution**: Auto-parse URLs in all article tools

**Implementation**:
```typescript
function parseGuardianUrl(url: string): string {
  return url.replace('https://www.theguardian.com/', '');
}
```

---

## ⭐ **HIGH-VALUE NEW FEATURES**

### **5. Enhanced Content Analysis Tools**
**Value Proposition**: Transform MCP into research analysis platform

#### **`guardian_content_timeline`**
```typescript
guardian_content_timeline({
  query: "climate change",
  from_date: "2023-01-01", 
  to_date: "2024-12-31",
  interval: "month"
})
```
**Output**: Article counts per period, major peaks, sample headlines, story evolution

#### **`guardian_author_profile`**  
```typescript
guardian_author_profile({
  author: "Damian Carrington",
  analysis_period: "2024"
})
```
**Output**: Publishing stats, section coverage, expertise areas, writing patterns

#### **`guardian_topic_trends`**
```typescript
guardian_topic_trends({
  topics: ["artificial intelligence", "Bill Cassidy", "brexit"],
  from_date: "2020-01-01",
  to_date: "2024-12-31",
  interval: "quarter"
})
```
**Key Feature**: Supports BOTH Guardian tags AND arbitrary keywords/phrases  
**Output**: Growth trends, seasonal patterns, comparative analysis

### **6. Intelligent Top Stories Analysis**
**Problem**: Date queries return chronological order, not editorial importance  
**Example**: Nov 6, 2000 shows football first, Bush vs Gore election buried at #35

```typescript
guardian_top_stories_by_date({
  date: "2000-11-06",
  story_count: 10
})
```

**Algorithm**: Analyze all headlines, prioritize by section importance, story complexity, breaking news patterns

### **7. Personalized Long Read Recommendations**
```typescript
guardian_recommend_longreads({
  count: 3,
  context?: string
})
```

**Algorithm**: Analyze user conversation context, match with Long Read topics, return curated suggestions with explanations

---

## 🛠️ **IMPLEMENTATION GUIDE**

### **Development Priority Order**
1. **CRITICAL**: Full article content (#1) - blocking user functionality
2. **PERFORMANCE**: Field optimization (#2) - user experience  
3. **ANALYSIS**: Content timeline + author profile (#5) - high user value
4. **UX**: URL parsing + tag visibility (#3, #4) - usability
5. **ADVANCED**: Topic trends + intelligent stories (#5, #6) - research value

### **Technical Approach**
- **Leverage existing API patterns** - no new external dependencies needed
- **Maintain current tool signatures** - additive changes only
- **Respect rate limits** - batch API calls efficiently for timeline/trends
- **Cache intelligently** - sections/tags rarely change

### **Testing Requirements**
**Critical Path Testing**:
- [ ] Full article content displays completely (Margaret Sullivan test case)
- [ ] Token streaming speed improved (measure before/after)
- [ ] All existing tools still work
- [ ] Tag data properly exposed and displayed
- [ ] URL parsing works for all article tools

**New Feature Testing**:
- [ ] Timeline analysis produces meaningful results
- [ ] Author profiles show accurate statistics  
- [ ] Topic trends work with both tags and keywords
- [ ] Top stories algorithm prioritizes correctly

---

## 📊 **SUCCESS CRITERIA**

### **Functional Requirements**
- [ ] Users can read complete articles (not previews)
- [ ] Browsing response time improved by 50%+
- [ ] Tag data visible and useful
- [ ] URLs accepted in all article tools
- [ ] 3 new analytical tools working

### **User Experience**
- [ ] Natural workflow: browse headlines → read full articles
- [ ] Research capabilities: track topics/authors over time  
- [ ] Intelligent curation: top stories + personalized recommendations
- [ ] Transparency: users understand similarity matching via tags

### **Technical Quality**
- [ ] No breaking changes to existing tools
- [ ] Rate limits respected with efficient batching
- [ ] Comprehensive error handling
- [ ] Clear documentation for new features

---

## 📚 **REFERENCE IMPLEMENTATION**

**Current Working Tools** (maintain compatibility):
- guardian_search, guardian_get_article, guardian_longread
- guardian_lookback, guardian_browse_section, guardian_get_sections  
- guardian_search_tags, guardian_search_by_length, guardian_search_by_author
- guardian_find_related

**Guardian API Capabilities** (confirmed working):
- Full article content via `body` field
- Rich tag data via `show-tags=all` parameter
- Flexible search with date ranges, sections, tags
- 500 calls/day rate limit

**Code Location**: `/Users/Job876/guardian-mcp-server-ts/`

---

## 🎯 **DELIVERABLES**

1. **Enhanced MCP Server** with all critical fixes and new analytical tools
2. **Updated Documentation** with examples of new capabilities  
3. **Performance Benchmarks** showing streaming speed improvements
4. **Test Suite** validating all functionality works correctly

**Timeline Estimate**: Critical fixes (1-2 days) + New features (3-4 days) = **~1 week total**

---

*This PRD represents user-tested requirements based on real Guardian MCP usage and comprehensive API analysis.*