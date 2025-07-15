import Icon from "@/components/atoms/icon/Icon";
import InputLabel from "@/components/atoms/input/InputLabel";
import React, { useState } from "react";
import { INSTRUMENT } from '@/pages/ensemble/types';

export interface SessionEnsembleFormState {
  sessionId?: string;
  instrument: string;
  recruitCount: string;
}

interface SessionFormProps {
  item: SessionEnsembleFormState;
  index: number;
  onSessionFormListChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onRemove: () => void; // 추가
}

export const SessionForm: React.FC<SessionFormProps> = ({
  item,
  index,
  onSessionFormListChange,
  onRemove // 추가
}) => {
  const INSTRUMENT_OPTIONS = Object.values(INSTRUMENT) as string[];

  // true: 직접입력, false: 목록에서 선택
  const [isCustomInput, setIsCustomInput] = useState(
    item.instrument !== "" && !INSTRUMENT_OPTIONS.includes(item.instrument)
  );

  const inputStyles = "w-full py-3 px-4 bg-brand-inverse border border-gray-300 rounded-md box-border text-caption placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]";

  return (
    <div className="w-full p-4 mb-4 border border-gray-300 rounded-xl bg-white space-y-4">
      <div className="">
        <div className="flex flex-col space-y-1">
          <div className="flex flex-row justify-between items-end">
            <InputLabel className="">악기</InputLabel>
            <button
              type="button"
              onClick={onRemove}
              aria-label="세션 삭제"
            >
              <Icon name="plus" className="text-red-500 rotate-45 mb-2" />
            </button>
          </div>
          {/* 토글 버튼 */}
          <div className="flex mb-4">
            <button
              type="button"
              className={`flex-1 py-2 rounded-l-md ${isCustomInput ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-700"} font-semibold`}
              onClick={() => setIsCustomInput(true)}
            >
              직접 입력
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-r-md ${!isCustomInput ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-700"} font-semibold`}
              onClick={() => setIsCustomInput(false)}
            >
              목록에서 선택
            </button>
          </div>
          {/* 입력/드롭다운 */}
          {isCustomInput ? (
            <input
              type="text"
              name="instrument"
              value={item.instrument}
              onChange={(e) => onSessionFormListChange(index, e)}
              className={inputStyles}
              placeholder="직접 입력"
              required
            />
          ) : (
            <select
              name="instrument"
              value={INSTRUMENT_OPTIONS.includes(item.instrument) ? item.instrument : ""}
              onChange={(e) => onSessionFormListChange(index, e)}
              className={inputStyles}
              required
            >
              <option value="" disabled>악기 선택</option>
              {INSTRUMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-[16px]">
          <InputLabel>모집 인원</InputLabel>
          <input
            type="number"
            name="recruitCount"
            value={item.recruitCount}
            onChange={(e) => onSessionFormListChange(index, e)}
            className={inputStyles}
            placeholder="1"
            min="1"
            required
          />
        </div>
      </div>
    </div>
  );
};