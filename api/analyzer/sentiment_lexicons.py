# analyzer/sentiment_lexicons.py

# Comprehensive list of generic words (stopwords)
generic_words = {
    'i', 'you', 'me', 'my', 'your', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'since', 'without', 'under', 'within', 'along', 'following', 'across',
    'behind', 'beyond', 'plus', 'except', 'but', 'up', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'like', 'is', 'was', 'are',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'get', 'got', 'go', 'went',
    'come', 'came', 'say', 'said', 'see', 'saw', 'know', 'knew', 'think', 'thought', 'want', 'wanted',
    'would', 'could', 'should', 'might', 'must', 'shall', 'may', 'need', 'let', 'make', 'made', 'take',
    'took', 'give', 'gave', 'put', 'find', 'found', 'tell', 'told', 'ask', 'asked', 'try', 'tried',
    'work', 'worked', 'call', 'called', 'leave', 'left', 'move', 'moved', 'live', 'lived', 'show', 'showed',
    'feel', 'felt', 'seem', 'seemed', 'look', 'looked', 'use', 'used', 'become', 'became', 'turn', 'turned',
    'start', 'started', 'end', 'ended', 'keep', 'kept', 'stay', 'stayed', 'begin', 'began', 'help', 'helped',
    'play', 'played', 'run', 'ran', 'walk', 'walked', 'talk', 'talked', 'sit', 'sat', 'stand', 'stood',
    'hold', 'held', 'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'read', 'really', 'actually',
    'probably', 'definitely', 'maybe', 'perhaps', 'quite', 'rather', 'pretty', 'enough', 'almost', 'always',
    'never', 'sometimes', 'usually', 'often', 'still', 'already', 'yet', 'soon', 'today', 'tomorrow',
    'yesterday', 'morning', 'afternoon', 'evening', 'night', 'time', 'year', 'month', 'week', 'day',
    'hour', 'minute', 'moment', 'second', 'first', 'last', 'next', 'new', 'old', 'good', 'bad', 'great',
    'small', 'big', 'large', 'little', 'long', 'short', 'high', 'low', 'right', 'left', 'early', 'late',
    'important', 'different', 'same', 'another', 'other', 'every', 'each', 'much', 'many', 'lot', 'lots',
    'thing', 'things', 'stuff', 'way', 'ways', 'people', 'person', 'man', 'woman', 'boy', 'girl', 'friend',
    'friends', 'family', 'home', 'house', 'place', 'world', 'country', 'city', 'school', 'work', 'job',
    'money', 'business', 'company', 'problem', 'problems', 'question', 'questions', 'answer', 'answers',
    'idea', 'ideas', 'part', 'parts', 'number', 'numbers', 'line', 'lines', 'word', 'words', 'name',
    'names', 'story', 'stories', 'fact', 'facts', 'hand', 'hands', 'eye', 'eyes', 'face', 'head',
    'body', 'life', 'lives', 'water', 'food', 'air', 'fire', 'earth', 'sun', 'moon', 'star', 'stars',
    'light', 'dark', 'color', 'colors', 'sound', 'sounds', 'music', 'book', 'books', 'movie', 'movies',
    'game', 'games', 'car', 'cars', 'phone', 'computer', 'internet', 'website', 'email', 'message',
    'messages', 'text', 'photo', 'photos', 'picture', 'pictures', 'video', 'videos', 'yeah', 'yes',
    'no', 'ok', 'okay', 'thanks', 'thank', 'please', 'sorry', 'excuse', 'hello', 'hi', 'hey', 'bye',
    'goodbye', 'sure', 'fine', 'well', 'oh', 'ah', 'um', 'uh', 'hmm', 'wow', 'cool', 'nice', 'awesome',
    'amazing', 'interesting', 'funny', 'weird', 'strange', 'crazy', 'stupid', 'smart', 'beautiful',
    'ugly', 'cute', 'hot', 'cold', 'warm', 'fast', 'slow', 'easy', 'hard', 'difficult',
    'simple', 'complex', 'free', 'cheap', 'expensive', 'rich', 'poor', 'happy', 'sad', 'angry',
    'excited', 'tired', 'bored', 'busy', 'ready', 'done', 'finished', 'started', 'over', 'under',
    'inside', 'outside', 'around', 'near', 'far', 'close', 'open', 'closed', 'full', 'empty',
    'clean', 'dirty', 'safe', 'dangerous', 'strong', 'weak', 'healthy', 'sick', 'dead', 'alive',
    'haha', 'hehe', 'lol', 'lmao', 'rofl', 'great', 'well', 'um', 'uh', 'hmm',
    'really', 'like', 'you know', 'sort of', 'kind of', 'literally', 'basically', 'actually', 'though',
    'anything', 'something', 'everything', 'nothing', 'someone', 'everyone', 'anyone', 'no one',
    'where', 'when', 'why', 'what', 'how', 'who', 'whom', 'whose', 'which', 'if', 'then', 'else',
    'because', 'since', 'while', 'until', 'although', 'even', 'though', 'whereas', 'whether',
    'such as', 'for example', 'e.g.', 'i.e.', 'etc', 'etcetera', 'et cetera', 'about', 'around',
    'through', 'throughout', 'without', 'within', 'between', 'among', 'across', 'against', 'behind',
    'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'but', 'by', 'down', 'during',
    'except', 'for', 'from', 'in', 'inside', 'into', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside',
    'over', 'past', 'round', 'since', 'than', 'through', 'to', 'toward', 'towards', 'under', 'until',
    'up', 'upon', 'versus', 'via', 'with', 'within', 'without', 'worth'
}

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