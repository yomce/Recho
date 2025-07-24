import axiosInstance from "@/services/axiosInstance";
import { useState } from "react";
import { 
  type PaginatedPracticeRoomResponse, 
  type PracticeRoom
} from "@/types/practiceRoom";


export interface PracticeRoomFilterParams {
  location?: string;
}

export const usePracticeRoomFilter = () => {
  const [filteredData, setFilteredData] = useState<PracticeRoom[]>([]);

  const fetchFilteredPracticeRoomList = async (filters: PracticeRoomFilterParams) => {
    try {
      const params = new URLSearchParams();

      if (filters.location) {params.append("location", filters.location);
      }

      const res = await axiosInstance.get<PaginatedPracticeRoomResponse>(
        `practice-room`,
        { params }
      );

      const { data } = res.data;
      setFilteredData(data);
    } catch (err) {
      console.error("필터링 실패:", err);
    }
  };

  return {
    filteredData,
    fetchFilteredPracticeRoomList,
  };
};