import toast from 'react-hot-toast';
import Icon from '../icon/Icon';

export const ToastMenu = ({
  onEdit,
  onComplete,
  onDelete,
} : {
  onEdit: () => void;
  onComplete?: () => void;
  onDelete: () => void;
}) => {
  toast.custom((t) => (
    <div
      className={`
        fixed bottom-0 left-1/2 -translate-x-1/2
        z-10 w-full max-w-[430px] mx-auto
        rounded-t-[30px] bg-white p-4 transition-all
        ${t.visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
    >
      <div className="w-12 h-1 bg-brand-disabled rounded-full mx-auto mt-1 mb-4 opacity-70" />
      <div className="bg-brand-frame rounded-xl mt-[40px]">
        <div className="flex items-start justify-center gap-2 py-3">
          <Icon name="edit" size={20} className="text-brand-gray" />
          <button
            className="text-caption text-brand-gray"
            onClick={() => {
              onEdit();
              toast.dismiss(t.id);
            }}
          >
            수정하기
          </button>
        </div>
        {onComplete && <div className="flex items-start justify-center gap-2 py-3">
          <Icon name="check" size={20} className="text-brand-gray" />
          <button
            className="text-caption text-brand-gray"
            onClick={() => {
              onComplete();
              toast.dismiss(t.id);
            }}
          >
            이 멤버와 합주하기
          </button>
        </div>}
        <div className="flex items-start justify-center gap-2 py-3">
          <Icon name="delete" size={20} className="text-brand-error-text" />
          <button
            className="text-caption text-brand-error-text"
            onClick={() => {
              onDelete();
              toast.dismiss(t.id);
            }}
          >
            삭제하기
          </button>
        </div>
        <div className="flex items-start justify-center gap-2 py-3">
          <button
            className="text-caption text-brand-gray"
            onClick={() => toast.dismiss(t.id)}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  ), {
    duration: 3000,     // 토스트 팝업 지속 시간
    position: 'bottom-center',
  });
};