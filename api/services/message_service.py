class MessageService:
    """Service class for message-related business logic"""

    @staticmethod
    def filter_messages(messages, me_list, remove_list, other_label='other'):
        """Filter and relabel messages based on criteria"""
        grouped = []
        for msg in messages:
            sender = msg.get('sender')
            if sender in remove_list:
                continue
            msg['sender'] = 'me' if sender in me_list else other_label
            grouped.append(msg)
        return grouped

    @staticmethod
    def deduplicate_messages(messages):
        """Remove duplicate messages based on timestamp, sender, and content"""
        seen = {}
        for msg in messages:
            key = (msg.get('timestamp'), msg.get('sender'), msg.get('message'))
            seen[key] = msg
        return list(seen.values())

    @staticmethod
    def count_keyword_occurrences(messages, keyword):
        """Count keyword occurrences by sender"""
        keyword_lower = keyword.lower()
        counts = {}

        for msg in messages:
            sender = msg.get('sender')
            text = msg.get('message', '')
            if keyword_lower in text.lower():
                counts[sender] = counts.get(sender, 0) + 1

        return counts