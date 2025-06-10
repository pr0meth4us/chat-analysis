import re
import json
from bs4 import BeautifulSoup
from .json_parser import parse_generic_json

def extract_json_from_html(soup):
    found = []
    for script in soup.find_all('script'):
        text = script.string or ''
        match = re.search(r"messages\s*=\s*(\[.*?\])", text, flags=re.DOTALL)
        if match:
            try:
                arr = json.loads(match.group(1))
                found.extend(parse_generic_json(arr))
            except json.JSONDecodeError:
                continue
    return found

def extract_telegram(soup):
    msgs = []
    last_sender = None
    for div in soup.find_all('div', class_='message'):
        ts = div.select_one('div.pull_right.date.details')
        timestamp = ts.get('title') if ts else None
        name = div.select_one('div.from_name')
        sender = name.get_text(strip=True) if name else last_sender
        last_sender = sender or last_sender
        txt = div.select_one('div.text')
        text = txt.get_text(strip=True) if txt else None
        if text and sender:
            msgs.append({'source': 'Telegram', 'timestamp': timestamp, 'sender': sender, 'message': text})
    return msgs

def extract_facebook(soup):
    msgs = []
    message_divs = soup.find_all('div', class_='_3-95 _a6-g')
    timestamp_divs = soup.find_all('div', class_='_3-94 _a6-o')
    for i, msg_div in enumerate(message_divs):
        sender_div = msg_div.select_one('div._2ph_._a6-h._a6-i')
        sender = sender_div.get_text(strip=True) if sender_div else None
        if not sender:
            continue
        content_div = msg_div.select_one('div._2ph_._a6-p')
        text = None
        if content_div:
            nested_divs = content_div.find_all('div')
            for nested in nested_divs:
                if nested.find('ul'):
                    continue
                content = nested.get_text(strip=True)
                if content and content not in ['', 'Nothing'] and not content.startswith(('❤', '👍', '🥺')):
                    text = content
                    break
        timestamp = None
        if i < len(timestamp_divs):
            ts_div = timestamp_divs[i].select_one('div._a72d')
            if ts_div:
                timestamp = ts_div.get_text(strip=True)
            else:
                timestamp = timestamp_divs[i].get_text(strip=True)
        if sender and text and len(text.strip()) > 0:
            msgs.append({'source': 'Facebook', 'timestamp': timestamp, 'sender': sender, 'message': text.strip()})
    return msgs

def extract_instagram(soup):
    msgs = []
    message_containers = soup.find_all('div', class_=['pam _3-95 _2ph- _a6-g uiBoxWhite noborder'])
    if not message_containers:
        message_containers = soup.find_all('div', class_=re.compile(r'.*message.*|.*msg.*'))
    for container in message_containers:
        sender_div = (container.select_one('div._3-95._2pim._a6-h._a6-i') or
                      container.select_one('div._2pim._a6-h._a6-i') or
                      container.select_one('div[class*="sender"]') or
                      container.select_one('div[class*="name"]'))
        sender = sender_div.get_text(strip=True) if sender_div else None
        if not sender:
            continue
        content_div = (container.select_one('div._3-95._a6-p') or
                       container.select_one('div._a6-p') or
                       container.select_one('div[class*="content"]'))
        text = None
        if content_div:
            nested_divs = content_div.find_all('div')
            for nested in nested_divs:
                if nested.find('ul') or nested.find('a'):
                    continue
                content = nested.get_text(strip=True)
                if (content and len(content) > 0 and
                        not content.startswith(('❤', '👍', '🥺', '😢', '😭', '🥹', '🤡')) and
                        not re.match(r'^[😀-🙏]+$', content)):
                    text = content
                    break
        timestamp = None
        ts_div = (container.select_one('div._3-94._a6-o') or
                  container.find_next_sibling('div', class_='_3-94 _a6-o') or
                  container.select_one('div[class*="timestamp"]'))
        if ts_div:
            timestamp = ts_div.get_text(strip=True)
        if sender and text and len(text.strip()) > 0:
            msgs.append({'source': 'Instagram', 'timestamp': timestamp, 'sender': sender, 'message': text.strip()})
    return msgs

def extract_imessage(soup):
    msgs = []
    for div in soup.find_all('div', class_='message'):
        rec = div.select_one('div.received')
        sent = div.select_one('div.sent')
        if rec:
            meta = rec.select_one('p')
            sender = meta.select_one('span.sender').text.strip() if meta and meta.select_one('span.sender') else 'Unknown'
            timestamp = meta.select_one('span.timestamp').text.strip() if meta and meta.select_one('span.timestamp') else None
            bubble = rec.select_one('span.bubble')
            text = bubble.get_text(strip=True) if bubble else None
        elif sent:
            meta = sent.select_one('p')
            sender = meta.select_one('span.sender').text.strip() if meta and meta.select_one('span.sender') else 'Me'
            timestamp = meta.select_one('span.timestamp').text.strip() if meta and meta.select_one('span.timestamp') else None
            bubble = sent.select_one('span.bubble')
            text = bubble.get_text(strip=True) if bubble else None
        else:
            continue
        if text:
            msgs.append({'source': 'iMessage', 'timestamp': timestamp, 'sender': sender, 'message': text})
    return msgs

def extract_discord_html(soup):
    msgs = []
    for div in soup.find_all('div', class_='chat-msg'):
        prof = div.find('div', class_='chat-msg-profile')
        if prof:
            date_div = prof.find('div', class_='chat-msg-date')
            if date_div and date_div.find('span'):
                sender = date_div.find('span').text.strip()
                timestamp = date_div.get_text(strip=True).replace(sender, '').strip()
            else:
                sender, timestamp = 'Unknown', None
        else:
            sender, timestamp = 'Unknown', None
        text_div = div.find('div', class_='chat-msg-text')
        text = text_div.get_text(strip=True) if text_div else None
        if text:
            msgs.append({'source': 'Discord (HTML)', 'timestamp': timestamp, 'sender': sender, 'message': text})
    return msgs