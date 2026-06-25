'use client';

import { useGwaStore } from '@/store/useGwaStore';
import { isNonAcademic, isIncomplete, isPassed } from '@/lib/gwa';
import { Card, CardContent } from '@/components/ui/card';

export function GradesTable() {
  const { entries } = useGwaStore();
  
  if (entries.length === 0) return null;

  const academicEntries = entries.filter(e => !isNonAcademic(e));

  return (
    <Card className="bg-ctu-accent border-none shadow-md overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between border-b border-black/20 pb-2 mb-3">
          <span className="text-[10px] font-semibold tracking-wider text-ctu-text-primary uppercase">Subject</span>
          <span className="text-[10px] font-semibold tracking-wider text-ctu-text-primary uppercase">Grade</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
          {academicEntries.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center text-ctu-text-primary">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium leading-tight line-clamp-2">
                  {entry.subjectName}
                </p>
                <p className="text-[10px] opacity-70 mt-0.5">{entry.units} units</p>
              </div>
              
              <div className="font-bold text-sm text-right shrink-0">
                {isIncomplete(entry) ? (
                  <span className="text-ctu-text-secondary">—</span>
                ) : (
                  <span className={isPassed(entry) ? 'text-ctu-grade-passed' : 'text-ctu-grade-failed'}>
                    {entry.gradePoint.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
