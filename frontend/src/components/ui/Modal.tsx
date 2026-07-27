import type { ReactNode } from 'react'
import { Modal as BsModal } from 'react-bootstrap'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** sm = kecil (alert/konfirmasi), md = dinamis (ikut lebar konten/input), lg/xl = tinggi & lebar (card, konten panjang) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** center = di tengah layar, top = menempel dari atas */
  position?: 'center' | 'top'
  /** aktifkan scroll internal saat konten lebih tinggi dari layar (cocok untuk size lg/xl) */
  scrollable?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  scrollable = false,
}: ModalProps) {
  return (
    <BsModal
      show={isOpen}
      onHide={onClose}
      size={size === 'md' ? undefined : size}
      centered={position === 'center'}
      scrollable={scrollable}
    >
      {title && (
        <BsModal.Header closeButton>
          <BsModal.Title>{title}</BsModal.Title>
        </BsModal.Header>
      )}
      <BsModal.Body>{children}</BsModal.Body>
    </BsModal>
  )
}
