export default function StarRating({ value = 0, onChange, readOnly = false }) {
  const current = Number(value) || 0

  return (
    <div className="stars" role="group" aria-label="별점">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= current ? 'star on' : 'star'}
          onClick={() => !readOnly && onChange?.(n)}
          disabled={readOnly}
          aria-label={`${n}점`}
          aria-pressed={n === current}
        >
          ★
        </button>
      ))}
    </div>
  )
}
