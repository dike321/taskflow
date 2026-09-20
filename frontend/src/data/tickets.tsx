import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export const TICKET_CATEGORIES = ['IT', 'Finance', 'Operations', 'HR', 'Facilities']
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export interface Ticket {
  id: number
  title: string
  description: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  reporterId: number
  assigneeId?: number
  createdAt: string
  dueDate?: string
  resolvedAt?: string
}

export interface TicketComment {
  id: number
  ticketId: number
  userId: number
  text: string
  createdAt: string
}

/** Urutan status yang valid untuk transisi maju (dipakai tombol aksi di UI). Reopen (resolved/closed -> open) ditangani terpisah. */
export const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
}

export const mockTickets: Ticket[] = [
  {
    id: 1,
    title: 'Laptop tidak bisa connect ke WiFi kantor',
    description: 'Laptop Dell Latitude sering putus koneksi WiFi sejak pagi ini, sudah dicoba restart tapi tetap sama.',
    category: 'IT',
    priority: 'high',
    status: 'in_progress',
    reporterId: 4,
    assigneeId: 1,
    createdAt: '2024-03-01',
    dueDate: '2024-03-05',
  },
  {
    id: 2,
    title: 'AC ruang gudang mati total',
    description: 'AC di Gudang Pusat Jakarta mati sejak semalam, suhu ruangan mulai mempengaruhi barang consumable.',
    category: 'Facilities',
    priority: 'urgent',
    status: 'open',
    reporterId: 5,
    createdAt: '2024-03-10',
    dueDate: '2024-03-12',
  },
  {
    id: 3,
    title: 'Request reimbursement transport dinas',
    description: 'Pengajuan reimbursement transport untuk kunjungan supplier tanggal 15 Februari.',
    category: 'Finance',
    priority: 'low',
    status: 'resolved',
    reporterId: 2,
    assigneeId: 4,
    createdAt: '2024-02-20',
    dueDate: '2024-02-25',
    resolvedAt: '2024-02-24',
  },
  {
    id: 4,
    title: 'Akses folder shared drive ditolak',
    description: 'Tidak bisa akses folder "Laporan Gudang 2024" di shared drive, muncul pesan permission denied.',
    category: 'IT',
    priority: 'medium',
    status: 'closed',
    reporterId: 3,
    assigneeId: 1,
    createdAt: '2024-01-15',
    dueDate: '2024-01-18',
    resolvedAt: '2024-01-17',
  },
  {
    id: 5,
    title: 'Printer di area Stock Opname macet terus',
    description: 'Printer label sering macet saat proses cetak label stock opname bulanan, sudah 3x kejadian minggu ini.',
    category: 'IT',
    priority: 'medium',
    status: 'open',
    reporterId: 4,
    createdAt: '2024-03-18',
    dueDate: '2024-03-22',
  },
]

export const mockTicketComments: TicketComment[] = [
  {
    id: 1,
    ticketId: 1,
    userId: 1,
    text: 'Sudah dicek, kemungkinan driver WiFi perlu di-update. IT support akan ke lokasi besok pagi.',
    createdAt: '2024-03-02T09:00:00',
  },
  {
    id: 2,
    ticketId: 1,
    userId: 4,
    text: 'Oke, ditunggu. Terima kasih.',
    createdAt: '2024-03-02T09:15:00',
  },
  {
    id: 3,
    ticketId: 3,
    userId: 4,
    text: 'Reimbursement sudah diproses, mohon dicek rekening dalam 1-2 hari kerja.',
    createdAt: '2024-02-24T14:00:00',
  },
]

interface TicketsContextValue {
  tickets: Ticket[]
  setTickets: Dispatch<SetStateAction<Ticket[]>>
  comments: TicketComment[]
  setComments: Dispatch<SetStateAction<TicketComment[]>>
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined)

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [comments, setComments] = useState<TicketComment[]>(mockTicketComments)

  return (
    <TicketsContext.Provider value={{ tickets, setTickets, comments, setComments }}>
      {children}
    </TicketsContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketsContext)
  if (!context) throw new Error('useTickets must be used within a TicketsProvider')
  return context
}
