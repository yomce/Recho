import toast from 'react-hot-toast';
import Icon from '@/components/atoms/icon/Icon';
import { STATUS, STATUS_TEXT } from '@/types/product';


export const StatusToastMenu = ({
  onChangeStatus,
  onClose,
  currentStatus,
}: {
  onChangeStatus: (status: STATUS) => void;
  onClose?: () => void;
  currentStatus: STATUS;
}) => {
  toast.custom((t) => (
    <div
      className={`
        fixed bottom-0 left-1/2 -translate-x-1/2
        w-full max-w-[430px] mx-auto
        rounded-t-[30px] bg-white p-4 shadow-md
        transition-all duration-300 ease-in-out
        pointer-events-auto
        ${t.visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
    >
      <div className="w-12 h-1 bg-brand-disabled rounded-full mx-auto mt-1 mb-4 opacity-70" />
      <div className="bg-brand-frame rounded-xl mt-[40px]">
        {Object.entries(STATUS).map(([key, value]) => {
          const isDisabled = currentStatus === 'SOLD';

          return (
            <div key={key} className="flex items-center justify-center gap-2 py-3">
              <Icon name="check" size={20} className="text-brand-gray" />
                <button
                type="button"
                className="text-caption text-brand-gray"
                disabled={isDisabled}
                onClick={() => {
                  if (value === 'SOLD') {
                  const confirmed = window.confirm('한 번 판매완료로 변경하면 되돌릴 수 없습니다. 진행할까요?');
                  if (!confirmed) return;
                  }
                  // 상태 변경
                  onChangeStatus(value as STATUS);
                  toast.dismiss(t.id);
                  onClose?.();
                }}
                >
                {STATUS_TEXT[value as STATUS]}
                </button>
          </div>
          )
        })}
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
    duration: Infinity,     // 토스트 팝업 지속 시간
    position: 'bottom-center',
    id: 'status-toast',
  });
};
