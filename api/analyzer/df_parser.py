import re
from typing import Dict, Any, List, Optional


class DfParser:
    def __init__(self, participants: List[str]):
        self.participants = participants
        self.url_pattern = re.compile(r'((?:https?://|www\.)[a-zA-Z0-9./\?=\-_%&@#~;,\+]+[a-zA-Z0-9/])')
        self.attachment_pattern = re.compile(r'^sent\s+an\s+attachment\.', re.IGNORECASE)
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')

    def _build_dynamic_inline_reaction_pattern(self) -> Optional[re.Pattern]:
        """Builds a regex that uses the emoji library for comprehensive emoji matching."""
        if not self.participants:
            return None

        sorted_names = sorted(self.participants, key=len, reverse=True)
        names_pattern_part = '|'.join(re.escape(name) for name in sorted_names)

        # Use comprehensive emoji pattern
        emoji_pattern = r'[\U0001F300-\U0001FAFF\u2600-\u27BF]'

        dynamic_pattern = re.compile(
            rf'(.*?)({emoji_pattern})\s*({names_pattern_part})$',
            re.UNICODE
        )
        return dynamic_pattern

    @staticmethod
    def _detect_info_sharing(message: str) -> Dict[str, Any]:
        if not isinstance(message, str) or len(message.strip()) == 0:
            return {
                'is_info_sharing': False,
                'confidence': 0.0,
                'indicators': [],
                'category': None
            }

        message = message.strip()
        indicators = []
        confidence_score = 0.0
        category = None

        # Pattern 1: News/Article indicators
        news_patterns = [
            r'\b(has since|according to|it is reported|sources say|officials said)\b',
            r'\b(government|ministry|official|spokesperson|representative)\b',
            r'\b(announced|declared|stated|confirmed|revealed)\b',
            r'\b(policy|agreement|treaty|declaration|resolution)\b',
            r'\b(meeting|conference|summit|talks|negotiations)\b',
            r'\b(dispute|conflict|tension|dialogue|consultation)\b'
        ]

        # Pattern 2: Formal announcements
        announcement_patterns = [
            r'\b(call for papers|deadline|submission|application)\b',
            r'\b(pleased to announce|we are announcing|it is announced)\b',
            r'\b(timeline|schedule|dates|registration)\b',
            r'\b(conference|workshop|seminar|symposium)\b',
            r'\b(partnership|collaboration|in cooperation with)\b',
            r'\b(interested candidates|applicants|participants)\b'
        ]

        # Pattern 3: Academic/Formal writing indicators
        formal_patterns = [
            r'\b(furthermore|however|nevertheless|therefore|consequently)\b',
            r'\b(in conclusion|in summary|to summarize|in other words)\b',
            r'\b(research|study|analysis|findings|methodology)\b',
            r'\b(implementation|framework|guidelines|provisions)\b'
        ]

        # Pattern 4: Quotation marks around large blocks (news quotes)
        quote_patterns = [
            r'"[^"]{100,}"',  # Long quoted text (100+ chars)
            r'["""][^"""]{100,}["""]'  # Smart quotes with long content
        ]

        # Pattern 5: Formal dates and times
        date_patterns = [
            r'\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b',
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{2}:\d{2}\s*(AM|PM|am|pm)\b'
        ]

        # Pattern 6: Organizational/Institutional names
        org_patterns = [
            r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b',  # Acronyms like ASEAN, DOC, COC
            r'\b(Academy|University|Institute|Foundation|Organization|Association)\b',
            r'\b(Cambodia|ASEAN|China|Beijing|Ministry|Department)\b'
        ]

        # Pattern 7: Professional/Academic language
        professional_patterns = [
            r'\b(implementation|coordination|consultations|provisions|bilateral)\b',
            r'\b(digital transformation|skills gap|practitioners|candidates)\b',
            r'\b(volume|publication|manuscript|submission|proposal)\b'
        ]

        # Check each pattern category
        pattern_categories = [
            ('news', news_patterns),
            ('announcement', announcement_patterns),
            ('formal', formal_patterns),
            ('academic', professional_patterns)
        ]

        for cat_name, patterns in pattern_categories:
            matches = 0
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    matches += 1
                    indicators.append(f"{cat_name}_language")

            if matches >= 2:  # Multiple matches in same category
                confidence_score += 0.3
                if not category:
                    category = cat_name

        # Check quote patterns
        for pattern in quote_patterns:
            if re.search(pattern, message):
                confidence_score += 0.4
                indicators.append('long_quotes')
                if not category:
                    category = 'quoted_content'

        # Check date patterns
        date_matches = sum(1 for pattern in date_patterns if re.search(pattern, message))
        if date_matches >= 2:
            confidence_score += 0.2
            indicators.append('formal_dates')

        # Check organizational patterns
        org_matches = sum(1 for pattern in org_patterns if re.search(pattern, message))
        if org_matches >= 3:
            confidence_score += 0.3
            indicators.append('organizational_names')

        # Additional heuristics
        word_count = len(message.split())

        # Very long messages with formal structure
        if word_count > 100:
            sentences = re.split(r'[.!?]+', message)
            valid_sentences = [s for s in sentences if s.strip()]
            if valid_sentences:
                avg_sentence_length = sum(len(s.split()) for s in valid_sentences) / len(valid_sentences)

                if avg_sentence_length > 15:  # Long, complex sentences
                    confidence_score += 0.2
                    indicators.append('complex_sentences')

        # Check for lack of personal pronouns (less personal)
        personal_pronouns = re.findall(r'\b(I|me|my|mine|you|your|yours|we|us|our|ours)\b', message, re.IGNORECASE)
        pronoun_ratio = len(personal_pronouns) / max(word_count, 1)

        if pronoun_ratio < 0.02 and word_count > 50:  # Very few personal pronouns in longer text
            confidence_score += 0.2
            indicators.append('impersonal_tone')

        # Check for formal punctuation patterns
        if re.search(r':\s*$', message) or message.count(';') >= 2:
            confidence_score += 0.1
            indicators.append('formal_punctuation')

        # Cap confidence at 1.0
        confidence_score = min(confidence_score, 1.0)

        # Determine if it's information sharing (threshold: 0.4)
        is_info_sharing = confidence_score >= 0.4

        return {
            'is_info_sharing': is_info_sharing,
            'confidence': round(confidence_score, 3),
            'indicators': list(set(indicators)),  # Remove duplicates
            'category': category,
            'word_count': word_count
        }

    @staticmethod
    def _find_reaction_type(message: str) -> Optional[str]:
        """Identifies if a message is a reaction and returns the reaction type."""
        if not isinstance(message, str) or len(message.strip()) == 0:
            return None

        message = message.strip()
        reaction_patterns = [
            re.compile(r'^(Liked|Laughed at|Emphasized|Loved|Disliked|Questioned)\s+"(.*)"$', re.IGNORECASE),
            re.compile(r'^(Liked|Laughed at|Emphasized|Loved|Disliked|Questioned)\s+(.*)$', re.IGNORECASE),
            re.compile(r'^You reacted (.*) to this message$', re.IGNORECASE),
            re.compile(r'^(.+) reacted (.*) to this message$', re.IGNORECASE),
            re.compile(r'^Reacted with (.+) to (.*)$', re.IGNORECASE),
            re.compile(r'^(.+) reacted to your message with (.+)$', re.IGNORECASE),
            re.compile(r'^You reacted to (.+)\'s message with (.+)$', re.IGNORECASE),
            re.compile(r'^(.+) (loved|liked|disliked|laughed at|was amazed by|got angry at) your message$',
                       re.IGNORECASE),
            re.compile(r'^You (loved|liked|disliked|laughed at|were amazed by|got angry at) (.+)\'s message$',
                       re.IGNORECASE),
            re.compile(
                r'^(You |[a-zA-Z\s]+?)(loved|liked|disliked|laughed at|emphasized|questioned) (an image|a message|a photo|a video)$',
                re.IGNORECASE),
            re.compile(r'^Reacted\s+(.+?)\s+to a message$', re.IGNORECASE),
            re.compile(r'^(.+) added (😀|😂|😢|😡|👍|👎|❤️|😍|😮|😠|🔥|💯|👏|🎉) to (.+)$', re.IGNORECASE),
            re.compile(r'^You added (😀|😂|😢|😡|👍|👎|❤️|😍|😮|😠|🔥|💯|👏|🎉) to (.+)$', re.IGNORECASE),
            re.compile(r'reacted|reaction', re.IGNORECASE),
        ]

        for pattern in reaction_patterns:
            match = pattern.search(message)
            if match:
                groups = match.groups()
                for group in groups:
                    if group and group.strip():
                        clean_group = group.strip().lower()
                        skip_words = {'you', 'your', 'to', 'this', 'message', 'an', 'a', 'the', 'with'}
                        if clean_group not in skip_words and len(clean_group) > 1:
                            reaction_mapping = {
                                'loved': 'love', 'liked': 'like', 'disliked': 'dislike', 'laughed at': 'laugh',
                                'emphasized': 'emphasize', 'questioned': 'question', 'was amazed by': 'wow',
                                'got angry at': 'angry', '😀': 'happy', '😂': 'laugh', '😢': 'sad',
                                '😡': 'angry', '👍': 'like', '👎': 'dislike', '❤️': 'love', '😍': 'love',
                                '😮': 'wow', '😠': 'angry', '🔥': 'fire', '💯': 'hundred', '👏': 'clap', '🎉': 'celebrate'
                            }
                            return reaction_mapping.get(clean_group, clean_group)
                return 'reaction'
        return None

    def parse_message_content(self, row) -> dict:
        """Parse message content to identify reactions, attachments, and info sharing."""
        message = row['message']
        sender = row['sender']

        result = {
            'is_reaction': False,
            'is_attachment': False,
            'is_info_sharing': False,
            'info_sharing_confidence': 0.0,
            'info_sharing_category': None,
            'info_sharing_indicators': [],
            'reaction_type': None,
            'text_content': '',
            'urls': []
        }

        if not message.strip():
            return result

        text_to_parse = message

        # Check for attachments
        if sender:
            prefix_pattern = re.compile(rf'^{re.escape(sender)}\s+sent\s+an\s+attachment\.', re.IGNORECASE)
            if prefix_pattern.search(text_to_parse):
                result['is_attachment'] = True
                result['text_content'] = ''
                return result

        dynamic_inline_pattern = self._build_dynamic_inline_reaction_pattern()
        if dynamic_inline_pattern:
            inline_match = dynamic_inline_pattern.search(text_to_parse)
            if inline_match:
                result['text_content'] = inline_match.group(1).strip()
                result['reaction_type'] = inline_match.group(2).strip()
                result['is_reaction'] = False

                # Extract URLs from text content
                urls_in_text = self.url_pattern.findall(result['text_content'])
                if urls_in_text:
                    result['urls'] = [u[0] for u in urls_in_text]
                    result['text_content'] = self.url_pattern.sub('', result['text_content']).strip()

                # Check for information sharing even in messages with reactions
                if result['text_content']:
                    info_result = self._detect_info_sharing(result['text_content'])
                    result['is_info_sharing'] = info_result['is_info_sharing']
                    result['info_sharing_confidence'] = info_result['confidence']
                    result['info_sharing_category'] = info_result['category']
                    result['info_sharing_indicators'] = info_result['indicators']

                return result

        standard_reaction_type = self._find_reaction_type(text_to_parse)
        if standard_reaction_type:
            result['is_reaction'] = True
            result['reaction_type'] = standard_reaction_type
            result['text_content'] = ''
            return result

        urls = self.url_pattern.findall(text_to_parse)
        if urls:
            result['urls'] = [u[0] for u in urls]
            result['text_content'] = ''
        else:
            result['text_content'] = text_to_parse.strip()

        if result['text_content']:
            info_result = self._detect_info_sharing(result['text_content'])
            result['is_info_sharing'] = info_result['is_info_sharing']
            result['info_sharing_confidence'] = info_result['confidence']
            result['info_sharing_category'] = info_result['category']
            result['info_sharing_indicators'] = info_result['indicators']

        return result
