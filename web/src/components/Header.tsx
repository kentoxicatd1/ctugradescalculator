import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function Header() {
  return (
    <header className="w-full bg-ctu-primary text-white p-4 shadow-md flex justify-between items-center z-10 relative">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          {/* A placeholder for the CTU logo - ideally this would be an actual img tag */}
          <span className="text-ctu-primary font-bold text-xs">CTU</span>
        </div>
        <h1 className="text-lg font-bold tracking-wide">CTU Grade Calculator</h1>
      </div>

      <Dialog>
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9 text-white hover:bg-ctu-primary-dark hover:text-white rounded-full">
          <Info className="h-5 w-5" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Latin Honors Qualifications</DialogTitle>
            <DialogDescription>
              Cebu Technological University (CTU) Latin Honors Guidelines
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">General Weighted Average (GWA)</h4>
              <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li><span className="font-medium text-foreground">Summa Cum Laude:</span> 1.000 – 1.200</li>
                <li><span className="font-medium text-foreground">Magna Cum Laude:</span> 1.201 – 1.450</li>
                <li><span className="font-medium text-foreground">Cum Laude:</span> 1.451 – 1.750</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Additional Qualifications</h4>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>✅ Complete all graduation requirements.</li>
                <li>✅ Complete at least 75% of the total academic units in residence at CTU (75% residency requirement).</li>
                <li>✅ Have no final grade lower than 2.50 in any subject (A grade &gt; 2.50 disqualifies).</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
