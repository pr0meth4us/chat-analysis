# analyzer/sentiment_lexicons.py

# CORE English function words only
base_generic_words = {
    # pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    # articles & determiners
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
    'its', 'our', 'their',
    # basic prepositions
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down',
    'over', 'under',
    # conjunctions & modals
    'and', 'or', 'but', 'if', 'because', 'so', 'as', 'while', 'though',
    'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might',
    # auxiliary verbs
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
}

# Chat-specific slang to filter out
CHAT_SLANG = {
    'ur', 'u', 'cuz', 'abt', 'im', 'lol', 'hey', 'ok', 'thx', 'idk',
    'haha', 'hehe', 'lmao', 'rofl'
}

# Unified stopword set for analysis
generic_words = base_generic_words.union(CHAT_SLANG)

khmer_stopwords = set()

# Lexicons for sentiment analysis
positive_words = {
    'love', 'great', 'awesome', 'amazing', 'fantastic', 'beautiful', 'happy', 'joy', 'wonderful', 'excellent',
    'perfect', 'nice', 'cool', 'fun', 'funny', 'sweet', 'cute', 'charming', 'brilliant', 'superb', 'thanks',
    'thank you', 'grateful', 'proud', 'excited', 'celebrate', 'congratulations', 'hooray', 'yay', 'wow'
}
negative_words = {
    'hate', 'terrible', 'awful', 'horrible', 'bad', 'sad', 'angry', 'upset', 'disappointed', 'cry', 'pain',
    'stress', 'anxious', 'worried', 'fear', 'fail', 'problem', 'issue', 'stupid', 'dumb', 'lame', 'sucks',
    'annoying', 'frustrated', 'difficult', 'hard', 'disaster', 'sorry'
}

sad_words = {
    'sad', 'upset', 'crying', 'cry', 'tears', 'lonely', 'heartbroken', 'depressed', 'miserable', 'unhappy',
    'grief', 'pain', 'hurts', 'awful', 'terrible', 'feeling down', 'devastated', 'hopeless', 'gloomy'
}

# Keywords for detecting romantic conversation
romance_words = {
    'love', 'darling', 'sweetheart', 'my dear', 'babe', 'honey', 'miss you', 'thinking of you',
    'date', 'kiss', 'hug', 'cuddle', 'my love', 'valentine', 'romance', 'romantic', 'adore', 'beautiful',
    'handsome', 'gorgeous', 'o sl b', 'b sl o'
}

# Note: This list contains sensitive terms for analysis purposes.
sexual_words = {
    'horny', 'sexy', 'naked', 'turn on', 'kinky', 'fetish', 'fuck', 'sex', 'pussy', 'dick', 'cock',
    'boobs', 'tits', 'ass', 'orgasm', 'cum', 'intercourse', 'making love', 'get laid', 'make out', 'cum'
}

argument_words = {
            'bitch', 'whore', 'hoe', 'fucker', 'fuck you', 'fucking', 'shit', 'damn', 'hell',
            'stupid', 'idiot', 'moron', 'asshole', 'bastard', 'dumbass', 'retard', 'loser',
            'shut up', 'piss off', 'go to hell', 'screw you', 'bite me', 'whatever', 'bullshit',
            'crap', 'suck', 'hate you', 'annoying', 'ridiculous', 'pathetic', 'disgusting',
            'wtf', 'stfu', 'gtfo', 'ffs', 'omfg'
        }