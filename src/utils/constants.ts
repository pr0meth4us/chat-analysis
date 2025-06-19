export const ACCEPTED_FILE_TYPES = {
    'application/json': ['.json'],
    'text/html': ['.html'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const TASK_POLL_INTERVAL = 2000; // 2 seconds

export const TASK_STATUS_COLORS = {
    pending: 'bg-yellow-500',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
};

export const TASK_STATUS_LABELS = {
    pending: 'Pending',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
};

export const DEFAULT_FILTER_CONFIG = {
    me: [],
    remove: [],
    other_label: 'other',
};