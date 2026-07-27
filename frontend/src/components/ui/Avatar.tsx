interface AvatarProps {
  name?: string
  src?: string
  size?: number
  className?: string
}

export default function Avatar({ name = '', src, size = 40, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-circle object-fit-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-medium ${className}`}
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
