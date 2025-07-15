// WebFrontend/src/hooks/useSearch.ts

import { useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { type SearchResults } from '../types/search';

export const useSearch = () => {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (keyword: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axiosInstance.get<SearchResults>('/search', {
        params: { keyword },
      });
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, error, performSearch };
};