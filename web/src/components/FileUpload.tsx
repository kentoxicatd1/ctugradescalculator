'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { extractTextFromPdf, parseText } from '@/lib/gwa';
import { useGwaStore } from '@/store/useGwaStore';
import { cn } from '@/lib/utils';

function isLikelyPdf(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return type === 'application/pdf' || type === 'application/x-pdf' || name.endsWith('.pdf');
}

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { pdfName, setEntries, reset } = useGwaStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!isLikelyPdf(file)) {
      setError('Please upload a valid PDF file.');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      
      const text = await extractTextFromPdf(file);
      const entries = parseText(text);
      
      if (entries.length === 0) {
        setError('No valid grades found in this PDF. Please ensure it is a CTU grade report.');
        return;
      }
      
      setEntries(entries, file.name);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error && err.message
        ? err.message
        : 'Unable to read this PDF. Please try downloading the grade report again and upload that copy.';
      setError(message);
      reset();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (pdfName) {
    return (
      <Card className="border-ctu-accent shadow-sm bg-ctu-bg dark:bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-ctu-accent/10 rounded-lg">
              <FileIcon className="h-5 w-5 text-ctu-accent" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">{pdfName}</p>
              <p className="text-xs text-muted-foreground">Parsed successfully</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0 ml-2">
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors duration-200 bg-ctu-bg dark:bg-card ${
        isDragging ? 'border-ctu-accent bg-ctu-accent/5' : 'border-border'
      } ${error ? 'border-destructive' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="p-4 bg-muted rounded-full">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-ctu-accent' : 'text-muted-foreground'}`} />
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">
            {isProcessing ? 'Processing PDF...' : 'Upload your CTU Grade Report'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your PDF here, or click to browse
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <label
          htmlFor="grade-pdf-upload"
          aria-disabled={isProcessing}
          className={cn(
            buttonVariants(),
            'bg-ctu-accent text-ctu-text-primary hover:bg-ctu-accent/90',
            isProcessing && 'pointer-events-none opacity-50'
          )}
        >
          Select PDF
        </label>
        <input 
          id="grade-pdf-upload"
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="application/pdf,.pdf"
          className="sr-only" 
          disabled={isProcessing}
        />
      </CardContent>
    </Card>
  );
}
