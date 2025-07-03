export interface SessionEnsembleFormState {
  sessionId?: string;
  instrument: string;
  recruitCount: string;
}

interface SessionFormProps {
  item: SessionEnsembleFormState;
  index: number;
  onSessionFormListChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  item,
  index,
  onSessionFormListChange
}) => {
  return (
    <div className="w-full p-4 mb-4 border rounded-xl shadow-sm bg-white space-y-4">
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">악기</label>
        <input
          type="text"
          name="instrument"
          value={item.instrument}
          onChange={(e) => onSessionFormListChange(index, e)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Instrument Name"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">모집 인원</label>
        <input
          type="number"
          name="recruitCount"
          value={item.recruitCount}
          onChange={(e) => onSessionFormListChange(index, e)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder=""
        />
      </div>
    </div>
  )
}