// components/CustomDatePicker.tsx
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isSameDay } from "date-fns";

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
}) => {
  return (
    <>
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        placeholderText="날짜 선택"
        dateFormat="yyyy-MM-dd"
        inline
        calendarClassName="mt-4 rounded-[20px] p-4 bg-white w-full border border-gray-100"
        dayClassName={(date) =>
          "text-caption w-10 h-10 flex items-center justify-center rounded-full " +
          (selectedDate && isSameDay(date, selectedDate)
            ? "bg-[#8E4DF6] text-white font-bold"
            : "hover:bg-[#F4EDFE]")
        }
        renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
          <div className="flex justify-between items-center mb-4 bg-[#8E4DF6] py-2 px-4 rounded-t-[20px]">
            <button onClick={decreaseMonth} className="px-2 py-1 text-white text-lg">
              ◀
            </button>
            <span className="text-white font-bold text-base">
              {date.getFullYear()}년 {date.getMonth() + 1}월
            </span>
            <button onClick={increaseMonth} className="px-2 py-1 text-white text-lg">
              ▶
            </button>
          </div>
        )}
      />
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

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #8E4DF6 !important;
          color: white !important;
          font-weight: bold !important;
        }
      `}
      </style>
    </>
  );
};
export default CustomDatePicker;

