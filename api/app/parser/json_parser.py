import json

def parse_generic_json(data):
    messages = []
    for msg in data:
        if all(k in msg for k in ('Date', 'From', 'Content')):
            messages.append({'source': 'TikTok', 'timestamp': msg['Date'], 'sender': msg['From'], 'message': msg['Content']})
        elif all(k in msg for k in ('date', 'from', 'content')):
            messages.append({'source': 'TikTok', 'timestamp': msg['date'], 'sender': msg['from'], 'message': msg['content']})
        elif 'timestamp' in msg and 'author' in msg and 'content' in msg:
            author = msg['author']
            sender = author.get('username') or author.get('From') or 'Unknown'
            messages.append({'source': 'Discord (JSON)', 'timestamp': msg['timestamp'], 'sender': sender, 'message': msg['content']})
    return messages