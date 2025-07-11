import { useRef, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import PrimaryButton from "./PrimaryButton";
import CustomDatePicker from "../input/CustomDatePicker";
import IconButton from "./IconButton";

interface FilterToastProps {
  activeTab: string; // 예: "날짜", "지역"
  toastId: string;
}

const REGIONS = [
  "서울", "경기", "인천", "강원", "충북", "충남",
  "세종", "대전", "광주", "전북", "경북", "대구",
  "제주", "전남", "경남/울산", "부산",
];

const INSTRUMENT = [
  "전체", "일렉기타", "베이스기타", "어쿠스틱기타", "피아노", "드럼",
];

const skillLevel = [
  "무관", "초급", "중급", "상급", "전문가",
];

const radioButtonStyle = (selected: boolean) =>
  `flex items-center gap-2 px-2 py-1 text-sm ${
    selected ? "text-brand-primary" : "text-brand-gray"
  }`;

const radioCircleStyle = (selected: boolean) =>
  `w-4 h-4 rounded-full border ${
    selected ? "border-brand-primary" : "border-gray-300"
  } flex items-center justify-center`;

const radioDotStyle = `w-2 h-2 rounded-full bg-brand-primary`;

const FilterToast: React.FC<FilterToastProps> = ({ activeTab, toastId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState("전체");
  const [selectedSkill, setSelectedSkill] = useState("무관");
  
  useEffect(() => {
    const el = document.getElementById(`filter-section-${activeTab}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-md h-[80vh] bg-white rounded-t-[30px] p-4 overflow-y-auto text-left"
    >
    <div className="w-12 h-1 bg-brand-disabled rounded-full mx-auto mt-1 mb-4 opacity-70" />
    <div className="p-4">
      <div className="flex flex-row justify-between items-center">
        <div className="text-button text-brand-gray py-4 border-b border-brand-frame">
          필터
        </div>
        <IconButton iconName="plus" className="text-brand-gray rotate-45" onClick={() => toast.dismiss(toastId)} />
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {/* 날짜 필터 */}
        <div id="filter-section-날짜" className="mb-8">
          <p className="text-caption text-brand-gray">날짜</p>
          {/* 날짜 필터 컴포넌트 또는 내용 */}
          <CustomDatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        </div>

        {/* 지역 필터 */}
        <div id="filter-section-지역" className="mb-8">
          <p className="text-caption text-brand-gray">지역</p>
          {/* 지역 필터 컴포넌트 또는 내용 */}
          <div className="grid grid-cols-4 gap-1 border border-brand-frame rounded-[20px] p-2 mt-4">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() =>
                  setSelectedRegion((prev) => (prev === region ? null : region))
                }
                className={`text-sm px-3 py-2 border border-white rounded-[10px] ${
                  selectedRegion === region
                    ? "bg-[#8E4DF6] text-white border-[#8E4DF6]"
                    : "bg-white text-brand-gray border-gray-300"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* 악기 필터 */}
        <div id="filter-section-악기" className="mb-8">
          <p className="text-caption text-brand-gray">악기</p>
          {/* 악기 필터 컴포넌트 또는 내용 */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {INSTRUMENT.map((item) => {
              const selected = selectedInstrument === item;
              return (
                <button
                  key={item}
                  onClick={() => setSelectedInstrument(item)}
                  className={radioButtonStyle(selected)}
                >
                  <div className={radioCircleStyle(selected)}>
                    {selected && <div className={radioDotStyle} />}
                  </div>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 실력 필터 */}
        <div id="filter-section-실력" className="mb-8">
          <p className="text-caption text-brand-gray">실력</p>
          {/* 실력 필터 컴포넌트 또는 내용 */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {skillLevel.map((item) => {
              const selected = selectedSkill === item;
              return (
                <button
                  key={item}
                  onClick={() => setSelectedSkill(item)}
                  className={radioButtonStyle(selected)}
                >
                  <div className={radioCircleStyle(selected)}>
                    {selected && <div className={radioDotStyle} />}
                  </div>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    <PrimaryButton
      className="py-4"
      onClick={() => toast.dismiss(toastId)}>
        적용하기
    </PrimaryButton>
    {/* Date-Picker를 위한 css 주입 */}
    <style>
    {`
      .react-datepicker {
        border-color: #f3f4f6 !important;
        border-radius: 20px !important;
      }

      .react-datepicker__month-container {
        width: 100%;
      }

      .react-datepicker__header {
        background: #8E4DF6 !important;
        border-bottom: none;
      }

      .react-datepicker__day-name {
        font-size: 14px;
        font-weight: 600;
        color: white !important;
      }

      .react-datepicker__day:hover {
        background-color: #F4EDFE !important;
        color: #000 !important;
      }

      /* 선택된 날짜 스타일 (isSameDay로 따로 설정하는 대신 강제 커버) */
      .react-datepicker__day--selected,
      .react-datepicker__day--keyboard-selected {
        background-color: #8E4DF6 !important;
        color: white !important;
        font-weight: bold !important;
      }
    `}
    </style>
  </div>
  );
};

export default FilterToast;
