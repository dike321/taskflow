export default function Footer() {
  return (
    <footer className="border-top bg-white py-3 px-4 d-flex justify-content-between text-muted small">
      <span>&copy; {new Date().getFullYear()} TaskFlow</span>
      <span>v0.0.0</span>
    </footer>
  )
}
