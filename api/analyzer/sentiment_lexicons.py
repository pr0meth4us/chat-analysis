# /sentiment_lexicons.py

BASE_GENERIC_WORDS = {
    # Pronouns, articles, prepositions, conjunctions, etc.
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'and', 'or', 'but', 'if', 'so', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'can',
    'could', 'not', 'no', 'very', 'just', 'all', 'any', 'some', 'about', 'what', 'when',
    'where', 'who', 'how', 'why', 'then', 'there', 'out', 'up', 'get', 'got', 'go',
    'going', 'really', 'see', 'say', 'said', 'know', 'think', 'one', 'like', 'also',
    'absolutely',
    'certainly',
    'course',          # For "of course"
    'definitely',
    'indeed',
    'ofc',             # Already in slang, but good to have here too
    'right',
    'sure',
    'totally',
    'true',
    'yep',
    'yup',
    'yes',
    'yessir',

    # Disagreement / Negation
    'nah',
    'naw',
    'no',
    'nope',

    # These multi-word phrases will be caught by the ngram_range=(1, 2)
    'of course',
    'for sure',
    'no way',
    'not really'
}

CHAT_SLANG_STOPWORDS = {
    # Original Slang
    'lol', 'haha', 'lmao', 'rofl', 'omg', 'wtf', 'btw', 'fyi', 'imo', 'tbh', 'ngl',
    'smh', 'ikr', 'brb', 'ttyl', 'ok', 'okay', 'kk', 'k', 'yeah', 'yep', 'ya', 'nah',
    'nope', 'fr', 'frfr', 'ong', 'u', 'ur', 'abt', 'im', 'hey', 'yo', 'sup', 'bruh',
    'bro', 'dude', 'sis', 'bestie', 'hmm', 'mhm', 'ahh', 'oh', 'well', 'anyway',

    # Previous custom additions
    'jg', 'tv', 'mex', 'ot', 'hz', 'ban', 'man', 'yy', 'dae',
    'ort', 'te', 'dg', 'pg', 'mean', 'yul', 'ey', 'ng', 'ke',
    'ah', 'ter', 'na', 'xd', 'don', 'jk', 'err', 'men', 'aii',
    'unsent', 'message', 'pinned', 'jum', 'tt', 'saey', 'chub',
    'ask', 'bek', 'brab', 'dear', 'either', 'eng', 'h', 'hmmm',
    'idk', 'jam', 'jes', 'kit', 'kom', 'kor', 'laor', 'long',
    'maybe', 'mer', 'mx', 'nh', 'oy', 'ppl', 'rean',
    'rg', 'sir', 'som', 'sur', 'ta', 'talk', 'tha', 'time',
    'too', 'true', 'yey',

    # --- NEW WORDS ADDED June 25, 2025 ---
    'ai',
    'am',
    'doch',
    'indeed',
    'knea',
    'love',
    'may',
    'min',
    'moa',
    'much',
    'ngai',
    'nham',
    'ofc',
    'pi',
    'sl',
    'way',
    'yes' # 'yes' was likely missed before, adding it now
}
HAPPY_BASE = {
    'happy', 'joy', 'wonderful', 'amazing', 'awesome', 'fantastic', 'excellent',
    'perfect', 'great', 'good', 'nice', 'fun', 'funny', 'hilarious', 'laughing',
    'smiling', 'excited', 'thrilled', 'delighted', 'pleased', 'glad', 'yay',
    'hooray', 'congrats', 'congratulations', 'celebrate', 'proud', 'blessed',
    'grateful', 'thankful', 'thanks', 'thank you', 'love it', 'love this', 'pog'
}

SAD_BASE = {
    'sad', 'unhappy', 'cry', 'crying', 'tears', 'heartbroken', 'devastated', 'crushed',
    'miserable', 'depressed', 'gloomy', 'hurts', 'pain', 'lonely', 'alone',
    'disappointed', 'let down', 'feeling down', 'feeling blue', 'awful', 'terrible',
    'hopeless', 'grief', 'sorrow', 'dejected', 'mourning'
}

ROMANTIC_BASE = {
    'love you', 'i like you', 'adore', 'babe', 'baby', 'honey', 'sweetheart', 'darling', 'my love',
    'soulmate', 'my everything', 'my world', 'bae', 'crush', 'miss you',
    'thinking of you', 'date', 'kiss', 'kisses', 'hug', 'hugs', 'cuddle', 'snuggle',
    'beautiful', 'handsome', 'gorgeous', 'sexy', 'cute', 'attractive', 'romance',
    'romantic', 'passion', 'desire', 'wifey', 'hubby', 'my king', 'my queen',
    'o sl b', 'b sl o', 'srolang', 'forever and always',
    'yours forever',
    'forever yours',
    'love you forever',
    'together forever',
    'my forever',
    'mine forever',
    'us forever'
}

ARGUMENT_BASE = {
    # Accusations & Blame
    'you always', 'you never', 'your fault', 'blame', 'accuse', 'selfish',
    'inconsiderate', 'thoughtless', 'nagging', 'lying', 'liar', 'cheater', 'cheating',
    'betrayed', 'unfaithful', 'bullshit', 'hypocritical'

    # Dismissal & Invalidation
    'k.', 'over it', 'dont care', "don't care", 'leave me alone', 'over with',
    'shut up', 'piss off', 'ridiculous', 'absurd', 'unbelievable', 'not listening',
    'you dont understand', "you don't understand",

    # Explicit Conflict & Anger
    'argument', 'fight', 'fighting', 'pissed', 'furious', 'upset with you',
    'hate you', 'fuck you', 'asshole', 'bitch', 'jerk', 'screw you', 'go to hell',

    # Relationship State Issues
    'break up', 'breaking up', 'its over', "it's over", 'done with you', 'i am done',
    'divorce', 'separation', 'trust issues', 'communication issues', 'serious talk',
    'we need to talk',

    # Expressions of Hurt & Frustration
    'disappointed in you', 'hurtful', 'you hurt me', 'let down', 'frustrated',
    'exhausted', 'sick of this', 'fed up', 'cant do this anymore', "can't do this anymore"
}

class AnalysisKeywords:
    def __init__(self):
        self.ARGUMENT = ARGUMENT_BASE
        self.ROMANTIC = ROMANTIC_BASE - self.ARGUMENT
        self.SAD = SAD_BASE - self.ARGUMENT
        self.HAPPY = HAPPY_BASE - self.ROMANTIC - self.ARGUMENT

    def to_dict(self):
        """Returns the keywords as a dictionary for easy access."""
        return {
            'HAPPY': self.HAPPY,
            'SAD': self.SAD,
            'ROMANTIC': self.ROMANTIC,
            'ARGUMENT': self.ARGUMENT
        }

ANALYSIS_KEYWORDS = AnalysisKeywords().to_dict()
COMPREHENSIVE_STOPWORDS = BASE_GENERIC_WORDS.union(CHAT_SLANG_STOPWORDS)

SEXUAL_CONTENT = {
    'horny', 'naked', 'nude', 'turn on', 'kinky', 'fetish', 'sex', 'pussy', 'dick',
    'cock', 'boobs', 'tits', 'ass', 'orgasm', 'cum', 'intercourse', 'making love',
    'get laid', 'make out', 'blowjob', 'oral', 'anal', 'penetrate', 'hookup',
    'netflix and chill', 'dtf', 'fwb', 'booty call', 'send nudes', 'sexting',
    'naughty', 'dirty', 'freaky', 'undress'
}