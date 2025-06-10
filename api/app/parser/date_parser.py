import re
from datetime import datetime
from ..utils import log

def clean_timestamp(ts):
    """Clean timestamp by removing read receipts and other extra info"""
    if not ts:
        return ts
    ts = re.sub(r'\s*\([^)]*\)\s*$', '', ts)
    ts = re.sub(r'^\s*at\s+', '', ts, flags=re.IGNORECASE)
    ts = re.sub(r'\s*UTC.*$', '', ts)
    ts = re.sub(r'\s*GMT.*$', '', ts)
    ts = re.sub(r'\s*\+\d{4}.*$', '', ts)
    ts = ' '.join(ts.split())
    return ts

def parse_khmer_date(ts):
    """Parse Khmer date format"""
    if not ts:
        return None

    khmer_months = {
        'មករា': 1, 'កុម្ភៈ': 2, 'មីនា': 3, 'មេសា': 4,
        'ឧសភា': 5, 'មិថុនា': 6, 'កក្កដា': 7, 'សីហា': 8,
        'កញ្ញា': 9, 'តុលា': 10, 'វិច្ឆិកា': 11, 'ធ្នូ': 12
    }
    try:
        has_khmer_month = any(month in ts for month in khmer_months.keys())
        if not has_khmer_month:
            return None
        month_num = None
        for kh_month, num in khmer_months.items():
            if kh_month in ts:
                month_num = num
                break
        if not month_num:
            return None
        numbers = re.findall(r'\d+', ts)
        if len(numbers) >= 5:
            day, year, hour, minute, second = map(int, numbers[:5])
        elif len(numbers) >= 4:
            day, year, hour, minute = map(int, numbers[:4])
            second = 0
        else:
            return None
        if 'ល្ងាច' in ts and hour < 12:
            hour += 12
        elif 'ព្រឹក' in ts and hour == 12:
            hour = 0
        return datetime(year, month_num, day, hour, minute, second)
    except Exception as e:
        log(f"Error parsing Khmer date '{ts}': {e}")
        return None

def parse_datetime_comprehensive(ts):
    """Comprehensive datetime parser with multiple format support"""
    if not ts:
        return None

    ts = clean_timestamp(ts)
    khmer_date = parse_khmer_date(ts)
    if khmer_date:
        return khmer_date

    formats = [
        '%Y-%m-%dT%H:%M:%S.%f%z', '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%dT%H:%M:%S.%fZ',
        '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M',
        '%d.%m.%Y %H:%M:%S', '%d.%m.%Y %H:%M', '%m/%d/%Y %H:%M:%S', '%m/%d/%Y %I:%M:%S %p',
        '%m/%d/%Y %H:%M', '%m/%d/%Y %I:%M %p', '%m/%d/%y %H:%M:%S', '%m/%d/%y %I:%M:%S %p',
        '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %I:%M:%S %p', '%d/%m/%Y %H:%M',
        '%b %d, %Y, %I:%M %p', '%b %d, %Y %I:%M:%S %p', '%b %d, %Y  %I:%M:%S %p',
        '%B %d, %Y, %I:%M %p', '%B %d, %Y %I:%M:%S %p', '%b %d, %Y, %H:%M:%S',
        '%B %d, %Y, %H:%M:%S', '%b %d, %Y %H:%M:%S', '%B %d, %Y %H:%M:%S',
        '%b %d, %Y', '%B %d, %Y', '%d-%m-%Y', '%m-%d-%Y', '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(ts, fmt)
            if dt.year == 1900:
                continue
            return dt
        except ValueError:
            continue

    try:
        year_match = re.search(r'\b(19|20)\d{2}\b', ts)
        if year_match:
            year = int(year_match.group())
            numbers = [int(x) for x in re.findall(r'\d+', ts)]
            if len(numbers) >= 3:
                for i, num in enumerate(numbers):
                    if num == year:
                        remaining = numbers[:i] + numbers[i+1:]
                        if len(remaining) >= 2:
                            month = remaining[0] if remaining[0] <= 12 else remaining[1] if remaining[1] <= 12 else 1
                            day = remaining[1] if remaining[0] <= 12 else remaining[0] if remaining[0] <= 31 else 1
                            if month > 12: month, day = day, month
                            if day > 31: day = 1
                            if month > 12: month = 1
                            hour = remaining[2] if len(remaining) > 2 and remaining[2] <= 23 else 0
                            minute = remaining[3] if len(remaining) > 3 and remaining[3] <= 59 else 0
                            second = remaining[4] if len(remaining) > 4 and remaining[4] <= 59 else 0
                            if 'PM' in ts.upper() and hour < 12: hour += 12
                            elif 'AM' in ts.upper() and hour == 12: hour = 0
                            return datetime(year, month, day, hour, minute, second)
    except Exception:
        pass
    return None