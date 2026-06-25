import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { GwaSummary } from '@/components/GwaSummary';
import { GradesTable } from '@/components/GradesTable';

export default function Home() {
  return (
    <div className="min-h-screen bg-ctu-bg dark:bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-6 overflow-hidden">
        <FileUpload />
        <GwaSummary />
        <GradesTable />
      </main>
    </div>
  );
}
