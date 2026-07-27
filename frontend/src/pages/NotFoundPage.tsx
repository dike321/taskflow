import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
      <h1 className="display-1 fw-bold text-primary">404</h1>
      <p className="fs-5 text-muted mb-4">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/" className="btn btn-primary">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
