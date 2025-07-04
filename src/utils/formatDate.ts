export const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateString += 'T00:00:00Z';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

export const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
};
