import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GradeEntry } from '@/lib/gwa';

interface GwaState {
  entries: GradeEntry[];
  pdfName: string | null;
  setEntries: (entries: GradeEntry[], pdfName?: string | null) => void;
  reset: () => void;
}

export const useGwaStore = create<GwaState>()(
  persist(
    (set) => ({
      entries: [],
      pdfName: null,
      setEntries: (entries, pdfName = null) => set({ entries, pdfName }),
      reset: () => set({ entries: [], pdfName: null }),
    }),
    {
      name: 'gwa-storage', // name of item in the storage (must be unique)
    }
  )
);
