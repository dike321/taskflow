import type { ReactNode } from 'react'
import { Table as BsTable } from 'react-bootstrap'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

function Table<T>({ columns, data, emptyMessage = 'No data available' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p className="mb-0">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <BsTable hover className="align-middle mb-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="text-uppercase small text-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(item) : (item as any)[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </BsTable>
    </div>
  )
}

export default Table
