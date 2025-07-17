// WebFrontend/src/pages/search/SearchPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { type SearchResults } from '../../types/search';
import SearchBar from '@/components/molecules/search/SearchBar';
import RecentSearchChip from '../../components/molecules/search/RecentSearchChip';
import SearchResultSection from '../../components/molecules/search/SearchResultSection';
import Icon from '../../components/atoms/icon/Icon';

const STORAGE_KEY = 'recent_searches';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const savedSearches = localStorage.getItem(STORAGE_KEY);
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
  }, []);

  const updateRecentSearches = (updatedList: string[]) => {
    setRecentSearches(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  const addRecentSearch = (term: string) => {
    const newList = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    updateRecentSearches(newList);
  };

  const removeRecentSearch = (term: string) => {
    updateRecentSearches(recentSearches.filter(s => s !== term));
  };

  const clearAllRecentSearches = () => updateRecentSearches([]);

  const executeSearch = async (term: string) => {
    setKeyword(term);
    addRecentSearch(term);
    setIsLoading(true);
    setResults(null);
    try {
      const response = await axiosInstance.get<SearchResults>('/search', { params: { keyword: term } });
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = (item: { id: number; title: string; subtitle: string; path: string; }) => (
    <div key={item.id} onClick={() => navigate(item.path)} className="p-4 cursor-pointer hover:bg-brand-frame">
      <p className="text-body font-semibold text-brand-text-primary truncate">{item.title}</p>
      <p className="text-footnote text-brand-gray truncate">{item.subtitle}</p>
    </div>
  );

  return (
    <div className="app-container">
      <div className="w-full max-w-[430px] p-4 space-y-6">
        <header className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}>
            <Icon name="back" size={24} />
          </button>
          <SearchBar 
            onSearch={executeSearch} 
            initialKeyword={keyword} 
            className="flex-1" 
          />
        </header>

        <main>
          {isLoading && <div className="text-center p-10 text-brand-gray">검색 중...</div>}

          {!isLoading && !results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-subheadline text-brand-text-primary">최근 검색</h2>
                <button onClick={clearAllRecentSearches} className="text-footnote font-semibold text-brand-gray">
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.length > 0 ? (
                  recentSearches.map((term, i) => (
                    <RecentSearchChip key={i} term={term} onSelect={executeSearch} onRemove={removeRecentSearch} />
                  ))
                ) : (
                  <p className="w-full text-center p-10 text-brand-gray">최근 검색 기록이 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {!isLoading && results && (
            <div className="space-y-8">
              <SearchResultSection 
                title="커뮤니티 게시글" 
                items={results.posts} 
                morePath="/community"
                keyword={keyword}
                renderItem={(item) => renderItem({ id: item.postId, title: item.title, subtitle: `작성자: ${item.author}`, path: `/community/${item.postId}` })}
              />
              <SearchResultSection 
                title="중고 거래" 
                items={results.usedProducts} 
                morePath="/used-products"
                keyword={keyword}
                renderItem={(item) => renderItem({ id: item.productId, title: item.title, subtitle: `${item.price.toLocaleString()}원`, path: `/used-products/${item.productId}` })}
              />
              <SearchResultSection 
                title="합주 모집" 
                items={results.recruitEnsembles} 
                morePath="/ensembles"
                keyword={keyword}
                renderItem={(item) => renderItem({ id: item.postId, title: item.title, subtitle: `요구 실력: ${item.skillLevel}`, path: `/ensembles/${item.postId}` })}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchPage;