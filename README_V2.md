# Guardian MCP Server v2.0 - Complete Feature Overview

An advanced MCP (Model Context Protocol) server providing comprehensive access to The Guardian newspaper's archive since 1999. Version 2.0 transforms the basic search interface into a full journalism research analysis platform.

## 🚀 **What's New in Version 2.0**

### **Critical Functionality Fixes**
- **✅ Full Article Reading**: Complete article content (no more 500-character truncation)
- **✅ Performance Optimization**: `detail_level` parameter for 50%+ faster browsing
- **✅ Tag Transparency**: Rich tag data visible with organized display
- **✅ URL Convenience**: Paste Guardian URLs directly in any article tool
- **✅ Content Control**: Optional truncation via `truncate` parameter

### **New Analytical Research Tools**
- **📊 `guardian_content_timeline`**: Track topic evolution over time with peak detection
- **👨‍💼 `guardian_author_profile`**: Comprehensive journalist analysis and expertise mapping
- **📈 `guardian_topic_trends`**: Compare multiple topics with growth analysis and correlations
- **🏆 `guardian_top_stories_by_date`**: Intelligent story prioritization for historical research
- **📚 `guardian_recommend_longreads`**: Context-aware Long Read recommendations
- **🔍 `guardian_get_article_tags`**: Detailed tag inspection for transparency

---

## 📖 **Complete Tool Reference**

### **Core Search & Discovery Tools**

#### **1. `guardian_search`** - Enhanced Article Search
Search Guardian articles with comprehensive filtering and performance optimization.

**New in v2.0**: `detail_level` parameter for performance optimization
```json
{
  "query": "climate change",
  "section": "environment", 
  "detail_level": "minimal",  // NEW: fast browsing mode
  "from_date": "2024-01-01",
  "order_by": "newest"
}
```

**Detail Levels:**
- `minimal`: Headlines only (fastest for browsing)
- `standard`: Headlines + summaries + metadata (balanced)
- `full`: Complete content including article body

#### **2. `guardian_get_article`** - Enhanced Single Article Retrieval
**New in v2.0**: Full content by default, URL support, tag visibility, truncation control
```json
{
  "article_id": "https://www.theguardian.com/politics/2024/dec/01/example",  // NEW: URL support
  "truncate": false  // NEW: full content by default
}
```

#### **3. `guardian_longread`** - Long Read Series Search
Access Guardian's premium feature articles from The Long Read series.

#### **4. `guardian_lookback`** - Historical Date Search
Find articles from specific dates for historical research.

#### **5. `guardian_browse_section`** - Section Browsing
Browse recent articles from specific Guardian sections.

#### **6. `guardian_get_sections`** - Section Discovery
Get all available Guardian sections for navigation.

#### **7. `guardian_search_tags`** - Tag Discovery
Search through Guardian's 50,000+ manually curated tags.

#### **8. `guardian_search_by_length`** - Word Count Filtering
Find articles by length (short briefs vs long-form journalism).

#### **9. `guardian_search_by_author`** - Journalist Search
Search articles by specific journalists with byline filtering.

#### **10. `guardian_find_related`** - Similarity Discovery
**Enhanced in v2.0**: Shows shared tags for transparency
Find related articles using shared tag analysis.

### **🆕 New Analytical Research Tools**

#### **11. `guardian_content_timeline`** ⭐ NEW
Analyze how topics evolve over time with trend detection and peak identification.

```json
{
  "query": "artificial intelligence",
  "from_date": "2024-01-01",
  "to_date": "2024-06-30", 
  "interval": "month"
}
```

**Provides:**
- Total article counts over time
- Peak coverage periods identification
- Sample headlines from each period
- Trend analysis (increasing/decreasing/stable)

**Example Output:**
- 979 articles in 6 months
- Peak in May 2024 (202 articles) 
- 71% coverage increase over period

#### **12. `guardian_author_profile`** ⭐ NEW
Generate comprehensive profiles of Guardian journalists with expertise analysis.

```json
{
  "author": "George Monbiot",
  "analysis_period": "2024"
}
```

**Provides:**
- Publishing statistics and output patterns
- Section coverage and specialization analysis
- Top topics and expertise areas
- Writing style analysis (word count patterns)
- Recent work samples

**Example Output:**
- 49 articles in 2024, avg 1206 words
- 95.9% Opinion specialist
- Top topics: Environment, Climate crisis, Politics

#### **13. `guardian_topic_trends`** ⭐ NEW
Compare multiple topics over time with correlation analysis and competitive rankings.

```json
{
  "topics": ["artificial intelligence", "climate change", "brexit"],
  "from_date": "2023-01-01",
  "to_date": "2024-12-31",
  "interval": "quarter"
}
```

**Provides:**
- Comparative article counts per topic
- Period-by-period rankings (🥇🥈🥉)
- Growth trend analysis
- Correlation detection between topics
- Seasonal pattern identification

**Example Output:**
- Climate change: 2,023 articles (most covered)
- AI: 770 articles (fastest growing +30.2%)
- Brexit: 1,773 articles (stable coverage)

#### **14. `guardian_top_stories_by_date`** ⭐ NEW
Get intelligently ranked top stories for any date using editorial prioritization algorithms.

```json
{
  "date": "2016-06-24",  // Brexit referendum day
  "story_count": 5
}
```

**Intelligent Ranking Based On:**
- Section editorial importance (Politics > World > Business)
- Story complexity (word count analysis)
- Breaking news timing (publication patterns)
- Headline significance keywords
- Senior correspondent bylines
- Topic importance tags

**Solves the Problem:** Traditional chronological ordering buries major stories (e.g., "Bush vs Gore buried at #35"). Our algorithm correctly prioritizes Brexit referendum coverage, Cameron resignation, and EU response as top stories.

#### **15. `guardian_recommend_longreads`** ⭐ NEW
Get personalized Long Read recommendations based on context and interests.

```json
{
  "count": 3,
  "context": "I'm researching technology and AI developments",
  "topic_preference": "digital culture"
}
```

**Context Analysis:**
- Extracts interests from user description
- Matches articles to detected themes
- Scores relevance based on topic alignment
- Considers content quality and recency
- Provides reading time estimates

**Example Output:**
- MrBeast YouTube analysis (21 min read, 82.0 relevance)
- Digital culture commentary (relevance scoring)
- Personalized explanations for recommendations

#### **16. `guardian_get_article_tags`** ⭐ NEW
Get detailed tag information for any article with organized display.

```json
{
  "article_id": "politics/2024/example"
}
```

**Provides:**
- Complete tag breakdown by type (Keyword, Contributor, Type, etc.)
- Tag usage statistics
- Transparency for similarity matching
- Understanding of Guardian's tagging system

---

## 🔧 **Enhanced Performance Features**

### **Smart Response Optimization**
- **Minimal Detail**: Headlines only for fast browsing
- **Standard Detail**: Balanced metadata for general use  
- **Full Detail**: Complete content when needed

### **URL Convenience**
All article tools now accept:
- Article IDs: `politics/2024/dec/01/example`
- Full URLs: `https://www.theguardian.com/politics/2024/dec/01/example`

### **Tag Transparency**
- See article tags in responses
- Understand similarity matching
- Organized tag display by type

---

## 📊 **Research Capabilities Unlocked**

### **Temporal Analysis**
- Track story evolution over time
- Identify peak coverage periods
- Analyze trend patterns and cycles

### **Journalist Intelligence** 
- Author expertise mapping
- Publishing pattern analysis
- Specialization identification

### **Comparative Research**
- Multi-topic trend analysis
- Correlation detection
- Competitive rankings over time

### **Historical Research**
- Intelligent story prioritization
- Editorial significance ranking
- Breaking news pattern recognition

### **Content Discovery**
- Context-aware recommendations
- Relevance-based curation
- Quality assessment algorithms

---

## 🚦 **Migration from v1.0**

**✅ Fully Backward Compatible**: All existing tools work exactly as before

**🚀 Enhanced Experience**: 
- Full article content now available by default
- Faster browsing with minimal detail level
- URL support in all article tools
- Tag visibility for better understanding

**🆕 New Capabilities**:
- 6 new analytical research tools
- Comprehensive journalism research platform
- Intelligence ranking and curation features

---

## 📈 **Performance Improvements**

**Measured Improvements:**
- **Token Efficiency**: 50%+ reduction in unnecessary metadata for browsing
- **Response Speed**: Optimized field selection based on use case
- **Content Access**: Complete articles without truncation
- **User Experience**: URL convenience eliminates ID extraction

---

## 🎯 **Use Cases Enabled**

### **Academic Research**
- Historical event analysis with intelligent story ranking
- Topic trend analysis over time periods
- Journalist expertise verification
- Content evolution tracking

### **Journalism Analysis** 
- Author profile generation
- Coverage pattern identification
- Editorial priority understanding
- Topic correlation discovery

### **Content Discovery**
- Personalized Long Read curation
- Context-aware recommendations
- Quality assessment and filtering
- Reading time optimization

### **Historical Investigation**
- Major event story prioritization
- Breaking news pattern analysis
- Timeline reconstruction
- Editorial significance ranking

---

## 🔗 **Installation & Usage**

**Quick Start:**
```bash
npx guardian-mcp-server
```

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "guardian": {
      "command": "npx",
      "args": ["guardian-mcp-server"],
      "env": {
        "GUARDIAN_API_KEY": "your-key-here"
      }
    }
  }
}
```

**Get your API key:** https://open-platform.theguardian.com/access/

---

Guardian MCP v2.0 transforms from a basic search interface into a comprehensive journalism research analysis platform, providing insights impossible to achieve through manual searching while maintaining full backward compatibility with v1.0 functionality.