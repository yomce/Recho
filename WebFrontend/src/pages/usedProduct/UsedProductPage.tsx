import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { type UsedProduct, type PaginatedUsedProductResponse } from '../../types/product';
import './UsedProductPage.css'; // 목록 및 로딩 스타일 CSS

// 커서의 타입을 명확하게 정의합니다.
interface Cursor {
  lastProductId: number;
  lastCreatedAt: string;
}

const UsedProductPage: React.FC = () => {
  const [items, setItems] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 커서 기반 페이지네이션 상태 관리 ---
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  // 데이터를 불러오는 함수
  const fetchItems = useCallback(async (isInitialFetch: boolean) => {
    // 로딩 중이거나 다음 페이지가 없으면 요청하지 않음
    if (loading || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '12', // 한 번에 불러올 개수
      });

      // 첫 로드가 아닐 경우(더보기 클릭 시) 커서 파라미터를 추가
      if (!isInitialFetch && nextCursor) {
        params.append('lastProductId', String(nextCursor.lastProductId));
        params.append('lastCreatedAt', nextCursor.lastCreatedAt);
      }

      const response = await axios.get<PaginatedUsedProductResponse>(
        // 백엔드 주소를 정확하게 입력해주세요.
        `http://localhost:3000/used-products`, 
        { params }
      );
      
      const { data, nextCursor: newCursor, hasNextPage: newHasNextPage } = response.data;

      // 첫 로드일 경우 데이터를 교체, 아닐 경우 기존 데이터에 새로운 데이터를 추가
      if (isInitialFetch) {
        setItems(data);
      } else {
        setItems(prevItems => [...prevItems, ...data]);
      }
      
      setNextCursor(newCursor ?? null);
      setHasNextPage(newHasNextPage);

    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('상품 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, nextCursor]); // useCallback 의존성 배열

  // 첫 마운트 시에만 데이터를 불러옵니다.
  useEffect(() => {
    fetchItems(true); // isInitialFetch = true
  }, []); // 의존성 배열이 비어있어 최초 1회만 실행됩니다.

  // '더보기' 버튼 클릭 핸들러
  const handleLoadMore = () => {
    fetchItems(false); // isInitialFetch = false
  };

  // --- UI 렌더링 ---
  return (
    <div className="page-container">
      <h2>상품 목록</h2>
      <Link to="/used-products/create" className="create-product-btn">
        상품 등록하기
      </Link>
      {error && <div className="message-container"><p className="error">{error}</p></div>}
      
      {items.length > 0 ? (
        <div className="item-list">
          {items.map((item) => (
            <div key={`${item.productId}-${item.createdAt}`}> {/* 중복 방지를 위한 더 안정적인 key */}
              <Link to={`/used-products/${item.productId}`} className="item-card">
                <div className="item-image-container">
                  <img src={item.imageUrl || 'https://placehold.co/600x400'} alt={item.title} />
                </div>
                <div className="item-info">
                  <h3>{item.title}</h3>
                  <p className="price">{item.price.toLocaleString()}원</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        // 로딩 중이 아닐 때만 "상품 없음" 메시지 표시
        !loading && <div className="message-container"><p>등록된 상품이 없습니다.</p></div>
      )}

      {/* 로딩 스피너는 로딩 중일 때 항상 표시 */}
      {loading && (
        <div className="message-container">
          <div className="spinner"></div>
        </div>
      )}

      {/* 로딩 중이 아니고, 다음 페이지가 있을 때만 '더보기' 버튼 표시 */}
      {!loading && hasNextPage && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} className="load-more-button">
            더보기
          </button>
        </div>
      )}
    </div>
  );
}

export default UsedProductPage;