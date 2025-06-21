base_generic_words = {
    # pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
    'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',

    # articles & determiners
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'some', 'any', 'all', 'each', 'every', 'both', 'either',
    'neither', 'one', 'two', 'few', 'many', 'much', 'more', 'most', 'less', 'least',

    # basic prepositions
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down',
    'over', 'under', 'into', 'onto', 'off', 'out', 'through', 'across', 'around',
    'between', 'among', 'behind', 'before', 'after', 'during', 'within', 'without',
    'above', 'below', 'near', 'far', 'inside', 'outside', 'beside', 'beyond',

    # conjunctions & modals
    'and', 'or', 'but', 'if', 'because', 'so', 'as', 'while', 'though', 'although',
    'since', 'until', 'unless', 'than', 'then', 'yet', 'still', 'however', 'therefore',
    'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might', 'shall',
    'ought', 'need', 'dare', 'used',

    # auxiliary verbs
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'get', 'got', 'getting', 'go', 'goes', 'went', 'going',

    # common verbs
    'say', 'said', 'says', 'tell', 'told', 'ask', 'asked', 'come', 'came',
    'see', 'saw', 'look', 'take', 'took', 'give', 'gave', 'make', 'made',
    'know', 'knew', 'think', 'thought', 'want', 'wanted', 'use', 'used',
    'work', 'worked', 'try', 'tried', 'find', 'found', 'put', 'keep', 'kept'
}

# Modern chat slang and abbreviations
CHAT_SLANG = {
    # Classic texting
    'ur', 'u', 'cuz', 'abt', 'im', 'lol', 'hey', 'ok', 'thx', 'idk',
    'haha', 'hehe', 'lmao', 'rofl', 'omg', 'wtf', 'btw', 'fyi', 'imo', 'imho',
    'tbh', 'ngl', 'smh', 'fml', 'yolo', 'bff', 'jk', 'ikr', 'ttyl', 'brb',

    # Modern slang (2020s)
    'sus', 'cap', 'nocap', 'bet', 'fam', 'periodt', 'slay', 'vibe', 'vibes',
    'lowkey', 'highkey', 'deadass', 'fr', 'frfr', 'ong', 'bestie', 'chile',
    'periodt', 'purr', 'ate', 'left no crumbs', 'its giving', 'slaps', 'hits different',
    'mid', 'basic', 'slaps', 'fire', 'goat', 'stan', 'simp', 'karen', 'ok boomer',

    # Reaction words
    'oop', 'yikes', 'oof', 'bruh', 'bro', 'dude', 'mans', 'girlie', 'bestie',
    'queen', 'king', 'sis', 'tea', 'spill', 'mood', 'same', 'felt', 'valid',

    # Abbreviated responses
    'k', 'kk', 'ye', 'yeah', 'yep', 'nah', 'nope', 'mhm', 'mm', 'hmm',
    'ahh', 'ohh', 'eww', 'ugh', 'pfft', 'meh', 'welp', 'whoops', 'oops'
}

# Khmer stopwords (basic set - expand as needed)
khmer_stopwords = {
    'ក្នុង', 'នៃ', 'គឺ', 'ជា', 'ដែល', 'បាន', 'ទៅ', 'មក', 'នេះ', 'នោះ',
    'ខ្ញុំ', 'អ្នក', 'គាត់', 'យើង', 'ពួកគេ', 'និង', 'ឬ', 'ប៉ុន្តែ', 'ពី', 'ដល់'
}

# Enhanced positive sentiment words
positive_words = {
    # Classic positive
    'love', 'great', 'awesome', 'amazing', 'fantastic', 'beautiful', 'happy', 'joy',
    'wonderful', 'excellent', 'perfect', 'nice', 'cool', 'fun', 'funny', 'sweet',
    'cute', 'charming', 'brilliant', 'superb', 'thanks', 'thank you', 'grateful',
    'proud', 'excited', 'celebrate', 'congratulations', 'hooray', 'yay', 'wow',

    # Modern positive slang
    'fire', 'lit', 'dope', 'sick', 'tight', 'fresh', 'clean', 'smooth', 'solid',
    'blessed', 'winning', 'crushing it', 'nailed it', 'killing it', 'slaying',
    'iconic', 'legendary', 'epic', 'insane', 'wild', 'crazy good', 'unreal',
    'chef kiss', 'immaculate', 'pristine', 'flawless', 'peak', 'top tier',

    # Emotional positivity
    'thrilled', 'elated', 'overjoyed', 'delighted', 'cheerful', 'upbeat', 'optimistic',
    'content', 'satisfied', 'pleased', 'glad', 'relieved', 'comfortable', 'peaceful',
    'calm', 'relaxed', 'chill', 'zen', 'blessed', 'lucky', 'fortunate', 'grateful',

    # Achievement/success
    'success', 'achieve', 'accomplish', 'win', 'victory', 'triumph', 'breakthrough',
    'progress', 'improve', 'upgrade', 'level up', 'glow up', 'boss', 'champion',

    'sby jet', 'sby', 'sby hah', 'yay'
}

# Enhanced negative sentiment words
negative_words = {
    # Classic negative
    'hate', 'terrible', 'awful', 'horrible', 'bad', 'sad', 'angry', 'upset',
    'disappointed', 'cry', 'pain', 'stress', 'anxious', 'worried', 'fear', 'fail',
    'problem', 'issue', 'stupid', 'dumb', 'lame', 'sucks', 'annoying', 'frustrated',
    'difficult', 'hard', 'disaster', 'sorry',

    # Modern negative slang
    'trash', 'garbage', 'mid', 'cringe', 'yikes', 'ick', 'gross', 'nasty', 'weird',
    'sus', 'sketchy', 'shady', 'toxic', 'problematic', 'cursed', 'chaotic', 'messy',
    'unhinged', 'deranged', 'concerning', 'red flag', 'walking red flag', 'aint it',

    # Emotional negativity
    'devastated', 'heartbroken', 'crushed', 'shattered', 'broken', 'destroyed',
    'ruined', 'wrecked', 'defeated', 'hopeless', 'helpless', 'worthless', 'useless',
    'pathetic', 'miserable', 'depressed', 'down', 'low', 'empty', 'numb', 'lost',

    # Anger/frustration
    'furious', 'livid', 'enraged', 'pissed', 'irritated', 'bothered', 'triggered',
    'fed up', 'done', 'over it', 'cant even', 'exhausted', 'drained', 'burnt out'
}

# Enhanced sadness-specific words
sad_words = {
    'sad', 'upset', 'crying', 'cry', 'tears', 'lonely', 'heartbroken', 'depressed',
    'miserable', 'unhappy', 'grief', 'pain', 'hurts', 'awful', 'terrible',
    'feeling down', 'devastated', 'hopeless', 'gloomy', 'blue', 'melancholy',
    'sorrowful', 'mournful', 'dejected', 'despondent', 'disheartened', 'crushed',
    'broken', 'shattered', 'empty', 'hollow', 'numb', 'lost', 'abandoned',
    'isolated', 'disconnected', 'worthless', 'defeated', 'overwhelmed', 'drained'
}

# Enhanced romance/relationship words
romance_words = {
    # Classic romance
    'love', 'darling', 'sweetheart', 'my dear', 'babe', 'honey', 'miss you',
    'thinking of you', 'date', 'kiss', 'hug', 'cuddle', 'my love', 'valentine',
    'romance', 'romantic', 'adore', 'beautiful', 'handsome', 'gorgeous',

    # Modern relationship terms
    'bae', 'baby', 'daddy', 'mommy', 'wifey', 'hubby', 'soulmate', 'ride or die',
    'main character', 'my person', 'my heart', 'my world', 'my everything',
    'crush', 'boyfriend', 'girlfriend', 'partner', 'significant other',

    # Affectionate actions
    'cuddle', 'snuggle', 'hold hands', 'embrace', 'caress', 'stroke', 'touch',
    'whisper', 'flirt', 'tease', 'seduce', 'charm', 'woo', 'court', 'pursue',

    # Khmer romance (examples)
    'o sl b', 'b sl o', 'srolang', 'oun', 'chit', 'sne', 'klaing'
}

# Enhanced sexual content detection (for content filtering)
sexual_words = {
    # Explicit terms
    'horny', 'sexy', 'naked', 'nude', 'turn on', 'kinky', 'fetish', 'fuck', 'sex',
    'pussy', 'dick', 'cock', 'boobs', 'tits', 'ass', 'orgasm', 'cum', 'intercourse',
    'making love', 'get laid', 'make out', 'blow job', 'oral', 'anal', 'penetrate',

    # Suggestive terms
    'hookup', 'netflix and chill', 'dtf', 'one night stand', 'fwb', 'friends with benefits',
    'booty call', 'slide into dms', 'send nudes', 'sext', 'sexting', 'naughty',
    'dirty', 'wild', 'freaky', 'nasty', 'bad', 'strip', 'undress', 'take off',

    # Body parts (euphemistic)
    'package', 'goods', 'junk', 'privates', 'bits', 'chest', 'curves', 'booty',
    'behind', 'bottom', 'rear', 'front', 'down there', 'intimate', 'private parts'
}

# WH-questions and interrogative words
wh_question_words = {
    # Basic WH words
    'what', 'who', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',

    # WH combinations
    'what is', 'what are', 'what was', 'what were', 'what do', 'what does', 'what did',
    'who is', 'who are', 'who was', 'who were', 'who do', 'who does', 'who did',
    'where is', 'where are', 'where was', 'where were', 'where do', 'where does', 'where did',
    'when is', 'when are', 'when was', 'when were', 'when do', 'when does', 'when did',
    'why is', 'why are', 'why was', 'why were', 'why do', 'why does', 'why did',
    'how is', 'how are', 'how was', 'how were', 'how do', 'how does', 'how did',
    'which is', 'which are', 'which was', 'which were', 'which do', 'which does', 'which did',

    # WH + modal verbs
    'what can', 'what could', 'what will', 'what would', 'what should', 'what might',
    'who can', 'who could', 'who will', 'who would', 'who should', 'who might',
    'where can', 'where could', 'where will', 'where would', 'where should', 'where might',
    'when can', 'when could', 'when will', 'when would', 'when should', 'when might',
    'why can', 'why could', 'why will', 'why would', 'why should', 'why might',
    'how can', 'how could', 'how will', 'how would', 'how should', 'how might',

    # Informal WH variations
    'whatcha', 'whats', 'wheres', 'whens', 'whys', 'hows', 'whos',
    'whatchu', 'watchu', 'whatchu doing', 'watchu doing', 'whatchu up to',

    # Question starters
    'do you', 'did you', 'are you', 'were you', 'can you', 'could you',
    'will you', 'would you', 'should you', 'have you', 'had you',
    'is it', 'was it', 'are they', 'were they', 'does it', 'did it'
}

# Enhanced argument/conflict words
argument_words = {
    # Profanity
    'bitch', 'whore', 'hoe', 'fucker', 'fuck you', 'fucking', 'shit', 'damn', 'hell',
    'asshole', 'bastard', 'son of a bitch', 'motherfucker', 'dickhead', 'prick',
    'cunt', 'slut', 'skank', 'trash', 'scum', 'piece of shit',

    # Insults
    'stupid', 'idiot', 'moron', 'dumbass', 'retard', 'loser', 'freak', 'weirdo',
    'creep', 'psycho', 'crazy', 'insane', 'mental', 'sick', 'disgusting', 'gross',
    'pathetic', 'worthless', 'useless', 'failure', 'disappointment', 'mistake',

    # Aggressive commands
    'shut up', 'piss off', 'go to hell', 'screw you', 'bite me', 'kiss my ass',
    'get lost', 'leave me alone', 'back off', 'stay away', 'mind your business',
    'who asked', 'nobody cares', 'dont care', 'whatever', 'wtv', 'talk to the hand',

    # Internet abbreviations
    'wtf', 'stfu', 'gtfo', 'ffs', 'omfg', 'kys', 'pos', 'sob', 'mf', 'bs',

    # Dismissive/condescending
    'ridiculous', 'absurd', 'laughable', 'joke', 'clown', 'fool', 'amateur',
    'basic', 'lame', 'cringe', 'embarrassing', 'shameful', 'disgraceful'
    'fine', 'sure', 'ok then', 'if you say so', 'noted', 'good for you',
    'must be nice', 'interesting', 'wow', 'cool story', 'thanks for that',
    'appreciate it', 'how thoughtful', 'lovely', 'fantastic', 'wonderful',
    'perfect', 'great job', 'well done', 'congrats', 'good luck with that',
    'hope that works out', 'we shall see', 'time will tell', 'sure thing',
    'absolutely', 'of course', 'naturally', 'obviously', 'clearly',
    'my bad', 'sorry not sorry', 'no offense but', 'just saying',
    'dont take this wrong but', 'not to be rude but', 'with all due respect'
}

# Anxiety/stress indicators
anxiety_words = {
    'anxious', 'anxiety', 'panic', 'stress', 'stressed', 'overwhelmed', 'worried',
    'nervous', 'scared', 'afraid', 'terrified', 'frightened', 'paranoid', 'tense',
    'on edge', 'freaking out', 'losing it', 'cant breathe', 'heart racing',
    'sweating', 'shaking', 'trembling', 'nauseous', 'sick to stomach', 'dizzy',
    "can't sleep", 'insomnia', 'restless', 'agitated', 'jittery', 'wound up'
}

# Excitement/energy words
excitement_words = {
    'excited', 'pumped', 'hyped', 'thrilled', 'ecstatic', 'elated', 'stoked',
    'buzzing', 'energetic', 'enthusiastic', 'eager', 'anticipating', "can't wait",
    'so ready', 'amped', 'fired up', 'psyched', 'over the moon', 'on cloud nine',
    'bouncing off walls', 'electric', 'alive', 'vibrant', 'dynamic', 'charged'
}

# Fatigue/exhaustion words
fatigue_words = {
    'tired', 'exhausted', 'drained', 'burnt out', 'worn out', 'wiped out',
    'dead tired', 'beat', 'spent', 'fatigued', 'weary', 'sleepy', 'drowsy',
    'lethargic', 'sluggish', 'low energy', 'running on empty', 'need sleep',
    'can barely keep eyes open', 'zombie', 'dragging', 'heavy', 'lifeless'
}

# Confidence/empowerment words
confidence_words = {
    'confident', 'strong', 'powerful', 'bold', 'brave', 'fearless', 'unstoppable',
    'badass', 'boss', 'queen', 'king', 'alpha', 'dominant', 'assertive',
    'self-assured', 'determined', 'fierce', 'warrior', 'champion', 'winner',
    'crushing it', 'killing it', 'owning it', 'on top', 'in control', 'got this'
}

# Social media specific expressions
social_media_expressions = {
    'sliding into dms', 'left on read', 'ghosted', 'breadcrumbing', 'catfish',
    'influencer', 'viral', 'trending', 'flex', 'flexing', 'humble brag',
    'thirst trap', 'story time', 'tea', 'spill tea', 'receipts', 'expose',
    'call out', 'cancel', 'ratio', 'based', 'woke', 'problematic', 'toxic'
}

generic_words = base_generic_words.union(CHAT_SLANG).union(khmer_stopwords)
content_filter_words = sexual_words.union(argument_words)
inappropriate_content = sexual_words.union(argument_words).union(social_media_expressions)

# Emotional state combinations
emotional_words = positive_words.union(negative_words).union(sad_words).union(anxiety_words).union(
    excitement_words).union(fatigue_words)
negative_emotional_states = negative_words.union(sad_words).union(anxiety_words).union(fatigue_words).union(
    argument_words)
positive_emotional_states = positive_words.union(excitement_words).union(confidence_words).union(romance_words)

# Relationship context
relationship_content = romance_words.union(sexual_words).union(argument_words)
intimate_conversation = romance_words.union(sexual_words)

# Analysis filtering combinations
analysis_stopwords = generic_words.union(wh_question_words)
conversation_fillers = CHAT_SLANG.union(wh_question_words).union(social_media_expressions)

# Conflict detection
conflict_indicators = argument_words.union(negative_words).union(anxiety_words)
hostility_markers = argument_words.union(sad_words).union(fatigue_words)

# Mental health screening
wellbeing_indicators = anxiety_words.union(sad_words).union(fatigue_words).union(negative_words)
positive_wellbeing = positive_words.union(excitement_words).union(confidence_words)

# Communication style analysis
formal_questions = wh_question_words.difference(CHAT_SLANG)
informal_communication = CHAT_SLANG.union(social_media_expressions)
questioning_behavior = wh_question_words.union(anxiety_words)

# Comprehensive content categories
all_emotional_content = positive_words.union(negative_words).union(sad_words).union(anxiety_words).union(
    excitement_words).union(fatigue_words).union(confidence_words)
all_relationship_signals = romance_words.union(sexual_words).union(argument_words).union(social_media_expressions)
all_non_content_words = generic_words.union(wh_question_words).union(khmer_stopwords).union(CHAT_SLANG)

# Contextual analysis
personal_distress = sad_words.union(anxiety_words).union(fatigue_words)
interpersonal_conflict = argument_words.union(negative_words).union(social_media_expressions)
positive_engagement = positive_words.union(excitement_words).union(romance_words)

# Advanced filtering
meaningful_content_filter = base_generic_words.union(CHAT_SLANG).union(wh_question_words).union(khmer_stopwords)
sentiment_analysis_words = positive_words.union(negative_words).union(sad_words).union(excitement_words).union(
    anxiety_words).union(confidence_words)
