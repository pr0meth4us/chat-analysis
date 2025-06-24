import re
import json


# Test the fixed reaction pattern
def test_inline_reaction_pattern():
    """Test function to verify the inline reaction pattern works correctly"""

    # Define the pattern components
    name_pattern = r'[a-zA-Z0-9\s\-\u1780-\u17FF]+'

    # FIXED: Updated pattern to handle emoji immediately followed by name (no space required)
    inline_reaction_pattern = re.compile(
        rf'(.*?)([\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])({name_pattern})$',
        re.DOTALL
    )

    # Test cases from your sample data
    test_messages = [
        "Me som ta 40% revenue te😢Gray Kray",
        "pay mor😢Gray Kray",
        "❤Gray Kray",
        "Click for audio👍Gray Kray",
        "Sman ta nak tas hav u kray or Gray xDDDD"  # Should NOT match as reaction
    ]

    print("Testing Inline Reaction Pattern:")
    print("=" * 50)

    for i, message in enumerate(test_messages, 1):
        print(f"\nTest {i}: '{message}'")

        match = inline_reaction_pattern.search(message)
        if match:
            text_content = match.group(1).strip()
            reaction_emoji = match.group(2).strip()
            reacted_to_user = match.group(3).strip()

            # Validation: reasonable name length
            if len(reacted_to_user) > 2 and len(reacted_to_user) < 50:
                print(f"  ✅ REACTION DETECTED")
                print(f"     Text content: '{text_content}'")
                print(f"     Reaction emoji: '{reaction_emoji}'")
                print(f"     Reacted to user: '{reacted_to_user}'")
            else:
                print(f"  ❌ Invalid reaction format - treating as regular text")
        else:
            print(f"  📝 Regular text message (no reaction pattern)")


def parse_message_content_test(message: str) -> dict:
    """Test version of the _parse_message_content method"""

    if not isinstance(message, str) or not message.strip():
        return {'is_reaction': False, 'reaction_type': None, 'reacted_to_user': None, 'urls': [], 'clean_text': ''}

    is_reaction = False
    reaction_type = None
    reacted_to_user = None
    urls = []

    # Define patterns
    name_pattern = r'[a-zA-Z0-9\s\-\u1780-\u17FF]+'
    std_reaction_pattern = re.compile(r'^(?:Reacted|You reacted)\s+([^\s]+)\s+to', re.IGNORECASE)
    inline_reaction_pattern = re.compile(
        rf'(.*?)([\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])({name_pattern})$',
        re.DOTALL
    )
    attachment_pattern = re.compile(r'^sent\s+an\s+attachment\.', re.IGNORECASE)
    url_pattern = re.compile(r'((?:https?://|www\.)[a-zA-Z0-9./\?=\-_%&@#~;,\+]+[a-zA-Z0-9/])')

    processing_text = message

    # Check for standard reaction format first
    std_reaction_match = std_reaction_pattern.search(processing_text)
    if std_reaction_match:
        reaction_type = std_reaction_match.group(1)
        return {'is_reaction': True, 'reaction_type': reaction_type, 'reacted_to_user': None, 'urls': [],
                'clean_text': ''}

    # Remove attachment indicators
    processing_text = attachment_pattern.sub('', processing_text).strip()

    # Check for inline reaction format (emoji + name at end)
    inline_reaction_match = inline_reaction_pattern.search(processing_text)
    if inline_reaction_match:
        is_reaction = True
        # Extract the three groups: text content, emoji, and name
        processing_text = inline_reaction_match.group(1).strip()
        reaction_type = inline_reaction_match.group(2).strip()
        reacted_to_user = inline_reaction_match.group(3).strip()

        # Additional validation: ensure this isn't just text containing those words
        if len(reacted_to_user) > 2 and len(reacted_to_user) < 50:
            # This looks like a valid reaction
            pass
        else:
            # Treat as regular text, not a reaction
            is_reaction = False
            reaction_type = None
            reacted_to_user = None
            processing_text = message

    # Extract URLs if not a reaction
    if not is_reaction:
        urls = url_pattern.findall(processing_text)
        if urls:
            processing_text = url_pattern.sub('', processing_text).strip()

    clean_text = processing_text

    return {
        'is_reaction': is_reaction,
        'reaction_type': reaction_type,
        'reacted_to_user': reacted_to_user,
        'urls': urls,
        'clean_text': clean_text
    }


def test_full_parsing():
    """Test the complete message parsing logic"""

    # Sample JSON data from your example
    sample_data = [
        {
            "source": "Facebook",
            "timestamp": "2022-05-08 11:13:47",
            "sender": "Adam",
            "message": "Me som ta 40% revenue te😢Gray Kray"
        },
        {
            "source": "Facebook",
            "timestamp": "2022-05-12 10:15:49",
            "sender": "Adam",
            "message": "pay mor😢Gray Kray"
        },
        {
            "source": "Facebook",
            "timestamp": "2022-05-13 10:59:05",
            "sender": "Adam",
            "message": "❤Gray Kray"
        },
        {
            "source": "Facebook",
            "timestamp": "2022-06-05 11:39:19 PM",
            "sender": "Adam",
            "message": "Click for audio👍Gray Kray"
        },
        {
            "source": "Facebook",
            "timestamp": "2022-06-06 02:07:59",
            "sender": "Adam",
            "message": "Sman ta nak tas hav u kray or Gray xDDDD"
        }
    ]

    print("\n\nTesting Complete Message Parsing:")
    print("=" * 50)

    for i, data in enumerate(sample_data, 1):
        message = data["message"]
        result = parse_message_content_test(message)

        print(f"\nTest {i}: '{message}'")
        print(f"  Original message: '{message}'")
        print(f"  Is reaction: {result['is_reaction']}")
        print(f"  Clean text: '{result['clean_text']}'")
        if result['is_reaction']:
            print(f"  Reaction type: '{result['reaction_type']}'")
            print(f"  Reacted to user: '{result['reacted_to_user']}'")
        print(f"  URLs found: {result['urls']}")


if __name__ == "__main__":
    # Run both tests
    test_inline_reaction_pattern()
    test_full_parsing()

    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("The fixed pattern should correctly:")
    print("✅ Parse 'Me som ta 40% revenue te😢Gray Kray' as reaction")
    print("✅ Extract 'Me som ta 40% revenue te' as clean text")
    print("✅ Extract '😢' as reaction_type")
    print("✅ Extract 'Gray Kray' as reacted_to_user")
    print("✅ Treat 'Sman ta nak tas hav u kray or Gray xDDDD' as regular text"