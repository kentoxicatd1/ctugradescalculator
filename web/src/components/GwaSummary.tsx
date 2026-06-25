'use client';

import { useGwaStore } from '@/store/useGwaStore';
import { calculateGpa, getHonorsStatus, isIncomplete, isNonAcademic } from '@/lib/gwa';
import { Card, CardContent } from '@/components/ui/card';

export function GwaSummary() {
  const { entries } = useGwaStore();
  
  if (entries.length === 0) return null;

  const gpa = calculateGpa(entries);
  const remark = getHonorsStatus(gpa, entries);
  
  const academicEntries = entries.filter(e => !isNonAcademic(e));
  const totalUnits = academicEntries.filter(e => !isIncomplete(e)).reduce((sum, e) => sum + e.units, 0);
  const subjectCount = academicEntries.length;
  
  const isPassed = gpa >= 1.0 && gpa <= 3.0;

  return (
    <Card className="bg-ctu-primary text-white border-none shadow-md overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-1 mb-6">
          <p className="text-[11px] text-white/70 tracking-widest uppercase">Cumulative GPA</p>
          <h2 className="text-5xl font-bold text-ctu-accent">{gpa > 0 ? gpa.toFixed(2) : '0.00'}</h2>
          {remark && (
            <p className="text-sm text-white/90 font-medium mt-1">{remark}</p>
          )}
        </div>

        <div className="h-px w-full bg-white/20 my-4" />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">Total Units</span>
            <span className="text-lg font-bold">{totalUnits}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">Subjects</span>
            <span className="text-lg font-bold">{subjectCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">Status</span>
            <span className={`text-lg font-bold ${isPassed ? 'text-ctu-accent' : 'text-red-400'}`}>
              {gpa > 0 ? (isPassed ? 'Passed' : 'Failed') : '—'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
