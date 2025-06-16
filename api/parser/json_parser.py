def parse_generic_json(data):
    messages = []
    if not isinstance(data, list):
        if isinstance(data, dict):
            for key in ['messages', 'conversation', 'chat_history']:  # Common keys for message lists
                if isinstance(data.get(key), list):
                    data = data.get(key)
                    break
            else:  # If no common key found, treat the dict itself if it matches a message structure
                if all(k in data for k in ('Date', 'From', 'Content')) or \
                        all(k in data for k in ('date', 'from', 'content')) or \
                        ('timestamp' in data and 'author' in data and 'content' in data):
                    data = [data]  # Wrap single message dict in a list
                else:
                    return []  # Not a recognizable message structure

    for msg in data:
        if not isinstance(msg, dict):
            continue  # Skip non-dictionary items

        # TikTok specific JSON structure
        if all(k in msg for k in ('Date', 'From', 'Content')):
            messages.append(
                {'source': 'TikTok', 'timestamp': msg['Date'], 'sender': msg['From'], 'message': msg['Content']})
        elif all(k in msg for k in ('date', 'from', 'content')):
            messages.append(
                {'source': 'TikTok', 'timestamp': msg['date'], 'sender': msg['from'], 'message': msg['content']})
        # Discord specific JSON structure (often from data exports)
        elif 'timestamp' in msg and 'author' in msg and 'content' in msg:
            author = msg['author']
            sender = author.get('username') or author.get('name') or author.get('From') or 'Unknown'
            messages.append({'source': 'Discord (JSON)', 'timestamp': msg['timestamp'], 'sender': sender,
                             'message': msg['content']})
        # General structure with 'sender', 'message', 'timestamp'
        elif 'sender' in msg and 'message' in msg and 'timestamp' in msg:
            messages.append(
                {'source': msg.get('source', 'Generic JSON'), 'timestamp': msg['timestamp'], 'sender': msg['sender'],
                 'message': msg['message']})
        # Add more specific JSON parsers here if needed for other platforms
    return messages
