import axiosInstance from "@/services/axiosInstance";
import { useState } from "react";
import { 
  type PaginatedEnsembleResponse, 
  type RecruitEnsemble, 
  REVERSE_SKILL_LEVEL_DIC
} from "@/pages/ensemble/types/index";

export interface EnsembleFilterParams {
  eventDate?: Date;
  location?: string;
  instrument?: string;
  skillLevel?: string;
}

export const useEnsembleFilter = () => {
  const [filteredData, setFilteredData] = useState<RecruitEnsemble[]>([]);

  const fetchFilteredEnsembleList = async (filters: EnsembleFilterParams) => {
    try {
      const params = new URLSearchParams();

      if (filters.eventDate) params.append("eventDate", filters.eventDate.toISOString());
      if (filters.location) params.append("location", filters.location);
      if (filters.instrument) params.append("instrument", filters.instrument);
      if (filters.skillLevel) {
        const skillNum = REVERSE_SKILL_LEVEL_DIC[filters.skillLevel];
        params.append("skillLevel", skillNum.toString());
      }

      const res = await axiosInstance.get<PaginatedEnsembleResponse>(
        `ensembles`,
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
    fetchFilteredEnsembleList,
  };
};