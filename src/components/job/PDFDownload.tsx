"use client";

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { JobPDF } from './JobPDF';
import { Job } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function PDFDownload({ job }: { job: Job }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button className="gap-2 bg-sky-600 hover:bg-sky-700 opacity-50 cursor-not-allowed">
        <FileText className="w-4 h-4" /> Generate PDF
      </Button>
    );
  }

  return (
    <PDFDownloadLink 
      document={<JobPDF job={job} />} 
      fileName={`JobCard_${job.quoteNumber || 'Draft'}.pdf`}
    >
      {({ loading }) => (
        <Button disabled={loading} className="gap-2 bg-sky-600 hover:bg-sky-700">
          <FileText className="w-4 h-4" /> 
          {loading ? 'Generating...' : 'Generate PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
