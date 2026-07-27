import { Pagination as BsPagination } from 'react-bootstrap'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <BsPagination className="mb-0">
      <BsPagination.Prev disabled={page === 1} onClick={() => onPageChange(page - 1)} />
      {pages.map((p) => (
        <BsPagination.Item key={p} active={p === page} onClick={() => onPageChange(p)}>
          {p}
        </BsPagination.Item>
      ))}
      <BsPagination.Next disabled={page === totalPages} onClick={() => onPageChange(page + 1)} />
    </BsPagination>
  )
}
