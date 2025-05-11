import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  itemCount: number; // Number of items currently shown on the page
  itemName: string; // e.g., "modules" or "sections"
}

export function PaginationControls({
  pagination,
  onPageChange,
  itemCount,
  itemName,
}: PaginationControlsProps) {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.ceil(total / pageSize);

  if (total <= pageSize) {
    // Don't show pagination if there's only one page or fewer items than page size
    return null;
  }

  // Calculate which page numbers to display (logic from AdminContent)
  const calculatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  const pageNumbers = calculatePageNumbers();

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {itemCount} of {total} {itemName}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Page</span>
        </Button>

        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? 'default' : 'outline'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Page</span>
        </Button>
      </div>
    </div>
  );
} 