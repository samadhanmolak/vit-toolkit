export default function Avatar({ name, size = 36 }) {
  const initials = name
    ? name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const colors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: colors[colorIndex],
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: size * 0.4,
    }}>
      {initials}
    </div>
  )
}