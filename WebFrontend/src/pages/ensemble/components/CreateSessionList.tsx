import type React from 'react';
import { useState } from 'react';
import type { CreateSessionEnsembleFormState } from './SessionForm';

interface CreateSessionEnsemblePayload {
  instrument: string;
  recruitCount: number;
  totalRecruitCount: number;
}

const CreateSessionEnsembleComponent: React.FC = () => {
  const [form, setForm] = useState<CreateSessionEnsembleFormState>({
    instrument: '',
    recruitCount: '0',
    totalRecruitCount: '0',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const payload: CreateSessionEnsemblePayload = {
        instrument: form.instrument,
        recruitCount: Number(form.recruitCount),
        totalRecruitCount: Number(form.totalRecruitCount)
      };

      
    }
  }

  return (

  )
}