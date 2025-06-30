import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { type UsedProduct, STATUS, TRADE_TYPE } from '../../types/product';
import './UsedProductDetailPage.css';

// Enum 값에 따른 한글 텍스트 매핑
const STATUS_TEXT = {
  [STATUS.FOR_SALE]: '판매중',
  [STATUS.IN_PROGRESS]: '예약중',
  [STATUS.SOLD]: '판매완료',
};

const TRADE_TYPE_TEXT = {
  [TRADE_TYPE.IN_PERSON]: '직거래',
  [TRADE_TYPE.DELIVERY]: '택배거래',
};


const UsedProductDetailPage: React.FC = () => {
  // URL의 파라미터에서 상품 ID를 가져옵니다. ex) /used-products/123 -> id: '123'
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<UsedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('잘못된 상품 ID입니다.');
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<UsedProduct>(
          `http://localhost:3000/used-products/${id}`
        );
        setProduct(response.data);
      } catch (err: any) {
        console.error('Failed to fetch product detail:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('상품을 찾을 수 없습니다.');
        } else {
          setError('상품 정보를 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]); // id가 바뀔 때마다 다시 데이터를 불러옵니다.

  // 수정 버튼 핸들러 (실제 수정 페이지로 이동)
  const handleEdit = () => {
    navigate(`/used-products/edit/${id}`);
  };

  // 삭제 버튼 핸들러
  const handleDelete = async () => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:3000/used-products/${id}`);
        alert('상품이 성공적으로 삭제되었습니다.');
        navigate('/used-products'); // 삭제 후 목록 페이지로 이동
      } catch (err) {
        console.error('Failed to delete product:', err);
        alert('상품 삭제에 실패했습니다.');
      }
    }
  };

  // 로딩 중일 때 표시할 UI
  if (loading) {
    return <div className="detail-container"><div className="spinner"></div></div>;
  }

  // 에러 발생 시 표시할 UI
  if (error) {
    return <div className="detail-container error-message">{error}</div>;
  }

  // 상품 데이터가 없을 경우 (로딩이 끝났지만 product가 null일 때)
  if (!product) {
    return <div className="detail-container">상품 정보가 없습니다.</div>;
  }

  return (
    <div className="detail-page-container">
      <div className="detail-content">
        <div className="image-section">
          <img src={product.imageUrl || 'https://placehold.co/600x400'} alt={product.title} />
        </div>

        <div className="info-section">
          <h1 className="product-title">{product.title}</h1>
          
          <div className="price-status-wrapper">
            <p className="product-price">{product.price.toLocaleString()}원</p>
            <span className={`status-badge status-${STATUS[product.status]}`}>
              {STATUS_TEXT[product.status]}
            </span>
          </div>

          <hr />

          <div className="meta-info">
            <p><strong>판매자:</strong> 사용자 ID {product.userId}</p>
            <p><strong>거래 방식:</strong> {TRADE_TYPE_TEXT[product.tradeType]}</p>
            <p><strong>거래 지역:</strong> {product.location.regionLevel1} {product.location.regionLevel2}</p>
            <p><strong>등록일:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="description-section">
            <h2>상품 설명</h2>
            <pre className="product-description">{product.description}</pre>
          </div>
          
          {/* TODO: 현재 로그인한 사용자가 판매자일 경우에만 이 버튼들이 보이도록 처리해야 합니다. */}
          <div className="actions-section">
            <Link to="/used-products" className="list-btn">
              목록으로
            </Link>
            {/* 오른쪽 버튼들을 그룹으로 묶어줍니다. */}
            <div className="edit-delete-group">
              <button onClick={handleEdit} className="edit-btn">수정하기</button>
              <button onClick={handleDelete} className="delete-btn">삭제하기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsedProductDetailPage;