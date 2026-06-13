'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface FooterProps {
  onPrev?: () => void;
  onNext?: () => void;
  canPrev: boolean;
  canNext: boolean;
  nextLabel?: string;
  loading?: boolean;
  showSkip?: boolean;
  skipMessage?: string;
}

export function ConsultFooter({
  onPrev,
  onNext,
  canPrev,
  canNext,
  nextLabel = '下一步',
  loading = false,
  showSkip = false,
  skipMessage,
}: FooterProps) {
  return (
    <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-gradient-to-t from-[#F7FAFC] via-[#F7FAFC] to-transparent">
      {showSkip && skipMessage && (
        <div className="mb-3 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3 animate-[shake_0.4s_ease-in-out]">
          {skipMessage}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={!canPrev || loading}
          className="h-11 px-5 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> 上一步
        </Button>

        <Button
          type="button"
          onClick={onNext}
          disabled={!canNext || loading}
          className="h-11 px-6 rounded-xl bg-[#3B82C4] hover:bg-[#2E6FA8] text-white shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              {nextLabel} <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
