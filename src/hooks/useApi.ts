// src/hooks/useApi.ts
import { useState, useCallback } from 'react';

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function useApi<T>() {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (apiCall: () => Promise<T>) => {
        setState({ data: null, loading: true, error: null });

        try {
            const result = await apiCall();
            setState({ data: result, loading: false, error: null });
            return result;
        } catch (error: unknown) {
            setState({ data: null, loading: false, error: String(error) });
            throw error;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}