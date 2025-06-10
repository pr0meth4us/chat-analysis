# Chat Message Analyzer Documentation

## What This System Does

This is a **chat analysis tool** that takes your exported chat files from various messaging platforms and provides detailed insights about your conversations. Think of it as a "relationship analyzer" for your digital communications.

### Supported Platforms
- **Telegram** (HTML/JSON exports)
- **Facebook Messenger** (HTML exports)  
- **Instagram** (HTML exports)
- **iMessage** (HTML exports)
- **Discord** (HTML/JSON exports)
- **TikTok** (JSON exports)

## How It Works

### 1. File Processing (`parser/` folder)
The system reads your exported chat files and converts them into a standard format:
- **Extracts messages** from HTML or JSON files
- **Parses timestamps** (including Khmer dates!)
- **Identifies senders** and message content
- **Removes duplicates** automatically

### 2. Data Analysis (`analyzer/` folder)
Once processed, it analyzes your conversations to find:
- **Response patterns** (how fast people reply)
- **Communication styles** (emoji usage, caps, questions)
- **Time patterns** (when you chat most)
- **Conversation flow** (who starts/ends conversations)
- **Language usage** (English vs Khmer)
- **Relationship dynamics** (balance, consistency)

### 3. Web API (`api/` folder)
Provides two main endpoints:
- **Upload & Parse**: `/upload` - processes your chat files
- **Filter & Analyze**: `/filter_and_analyze` - generates insights

## Key Features

### 📊 What You Get From Analysis

**Response Metrics**
- Average response times between people
- Who responds fastest/slowest
- Quick response rates (under 1 min, 5 min)

**Ghost Period Detection**
- Times when conversation went silent (6+ hours)
- Who usually breaks the silence
- Longest periods without messages

**Communication Patterns**
- Peak hours and days for chatting
- Conversation lengths and intensity
- Who initiates vs responds more

**Language & Style Analysis**
- Most used words and phrases
- Emoji usage patterns
- English vs Khmer usage rates
- Caps lock and punctuation habits

**Relationship Health**
- Communication balance (50/50 vs uneven)
- Consistency over time
- Conversation depth and engagement

### 🔧 Technical Components

**Date Parser** (`date_parser.py`)
- Handles multiple date formats
- **Khmer date support** (មករា, កុម្ភៈ, etc.)
- Timezone cleaning and normalization

**HTML Parser** (`html_parser.py`)
- Extracts messages from exported HTML files
- Platform-specific parsing (each app exports differently)
- Handles nested HTML structures

**JSON Parser** (`json_parser.py`)
- Processes JSON chat exports
- Flexible field mapping for different formats

**Main Analyzer** (`main_analyzer.py`)
- Core analysis engine with 1000+ lines of logic
- Calculates conversation metrics and patterns
- Generates comprehensive JSON reports

## How to Use

### Step 1: Export Your Chats
Export your chat history from your messaging app:
- **Telegram**: Settings → Advanced → Export chat data
- **Facebook**: Download your Facebook data
- **Instagram**: Request your data download
- **Discord**: Use DiscordChatExporter tool

### Step 2: Upload Files
```bash
# Upload your exported files
curl -X POST http://localhost:5000/upload \
  -F "files=@telegram_export.html" \
  -F "files=@facebook_messages.html"
```

### Step 3: Analyze
```bash
# Analyze the processed messages
curl -X POST http://localhost:5000/filter_and_analyze \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [...], 
    "me": ["Your Name"], 
    "remove": ["Bot", "System"], 
    "other_label": "Friend"
  }'
```

### Step 4: Get Insights
The system returns a detailed JSON report with all the analysis results.

## Docker Setup

### Simple Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "asgi:asgi_app", "-k", "uvicorn.workers.UvicornWorker"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  chat-analyzer:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./uploads:/app/uploads
    environment:
      - FLASK_ENV=production
```

## Project Structure
```
chat-analyzer/
├── api/
│   ├── __init__.py
│   ├── app.py              # Flask app factory
│   ├── routes/
│   │   ├── upload.py       # File upload endpoint
│   │   └── analyze.py      # Analysis endpoint
│   └── parser/
│       ├── main_parser.py  # Main file processor
│       ├── date_parser.py  # Date/time parsing
│       ├── html_parser.py  # HTML extraction
│       └── json_parser.py  # JSON extraction
├── analyzer/
│   └── main_analyzer.py    # Core analysis engine
├── asgi.py                 # ASGI application entry
├── requirements.txt
└── Dockerfile
```

## Sample Analysis Output

```json
{
  "dataset_overview": {
    "total_messages": 15420,
    "date_range": {
      "start_date": "2023-01-15",
      "end_date": "2024-12-20"
    },
    "participants": ["me", "friend"]
  },
  "response_metrics": {
    "me_to_friend": {
      "avg_response_time_minutes": 12.5,
      "quick_responses_under_1min": 245,
      "response_count": 1200
    }
  },
  "relationship_metrics": {
    "daily_average_messages": 42.3,
    "communication_balance": {
      "me": 52.1,
      "friend": 47.9
    },
    "balance_score": 95.8,
    "relationship_intensity": "EXTREMELY_HIGH"
  }
}
```

## Key Benefits

1. **Privacy Focused**: All processing happens locally/on your server
2. **Multi-Platform**: Works with exports from major chat apps
3. **Comprehensive**: Analyzes conversation patterns, not just word counts
4. **Actionable Insights**: Understand communication dynamics and relationship health
5. **Export Friendly**: JSON output can be used for further analysis or visualization

## Use Cases

- **Relationship Analysis**: Understand communication patterns with friends/partners
- **Digital Wellness**: Track your messaging habits and screen time patterns  
- **Research**: Academic studies on digital communication
- **Personal Insights**: Learn about your own communication style
- **Backup Analysis**: Process old chat backups to rediscover memories

This tool essentially turns your chat exports into meaningful insights about your digital relationships and communication habits!