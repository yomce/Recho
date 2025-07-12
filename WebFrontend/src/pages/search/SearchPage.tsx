import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance'; 

// --- 타입 정의: 백엔드의 응답(SearchResponseDto)과 형식을 맞춥니다 ---
interface Post {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}
interface UsedProduct {
  productId: number;
  title: string;
  price: number;
  imageUrl?: string;
}
interface RecruitEnsemble {
  postId: number;
  title: string;
  skillLevel: string;
  eventDate: string;
}

interface SearchResults {
  posts: Post[];
  usedProducts: UsedProduct[];
  recruitEnsembles: RecruitEnsemble[];
}

// --- 검색 페이지 컴포넌트 ---
const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 폼 제출 시 실행될 함수
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // 백엔드에 만들어둔 통합 검색 API 호출
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

  // 결과 아이템 렌더링 함수 (예시)
  const renderPostItem = (post: Post) => (
    <div key={`post-${post.id}`} onClick={() => navigate(`/community/posts/${post.id}`)} className="p-4 border-b cursor-pointer hover:bg-gray-50">
      <p className="font-semibold text-gray-800">{post.title}</p>
      <p className="text-sm text-gray-500">{post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
    </div>
  );

  const renderUsedProductItem = (product: UsedProduct) => (
    <div key={`product-${product.productId}`} onClick={() => navigate(`/used-products/${product.productId}`)} className="p-4 border-b cursor-pointer hover:bg-gray-50">
      <p className="font-semibold text-gray-800">{product.title}</p>
      <p className="text-sm text-gray-500">{product.price.toLocaleString()}원</p>
    </div>
  );
  
  const renderRecruitEnsembleItem = (ensemble: RecruitEnsemble) => (
     <div key={`ensemble-${ensemble.postId}`} onClick={() => navigate(`/ensemble/${ensemble.postId}`)} className="p-4 border-b cursor-pointer hover:bg-gray-50">
      <p className="font-semibold text-gray-800">{ensemble.title}</p>
      <p className="text-sm text-gray-500">{ensemble.skillLevel} · {new Date(ensemble.eventDate).toLocaleDateString()}</p>
    </div>
  );


  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">통합 검색</h1>
      
      {/* 검색 입력 폼 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="관심 있는 내용을 검색해보세요"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
          검색
        </button>
      </form>

      {/* 로딩 및 에러 상태 표시 */}
      {isLoading && <p className="text-center">검색 중...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* 검색 결과 표시 */}
      {results && (
        <div className="space-y-8">
          {/* 커뮤니티 게시글 섹션 */}
          <section>
            <h2 className="text-xl font-semibold border-b pb-2 mb-2">커뮤니티 게시글</h2>
            {results.posts.length > 0 ? (
              results.posts.map(renderPostItem)
            ) : (
              <p className="text-gray-500 p-4">관련 게시글이 없습니다.</p>
            )}
          </section>

          {/* 중고 거래 섹션 */}
          <section>
            <h2 className="text-xl font-semibold border-b pb-2 mb-2">중고 거래</h2>
            {results.usedProducts.length > 0 ? (
              results.usedProducts.map(renderUsedProductItem)
            ) : (
              <p className="text-gray-500 p-4">관련 상품이 없습니다.</p>
            )}
          </section>

          {/* 합주 모집 섹션 */}
          <section>
            <h2 className="text-xl font-semibold border-b pb-2 mb-2">합주 모집</h2>
             {results.recruitEnsembles.length > 0 ? (
              results.recruitEnsembles.map(renderRecruitEnsembleItem)
            ) : (
              <p className="text-gray-500 p-4">관련 모집글이 없습니다.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SearchPage;