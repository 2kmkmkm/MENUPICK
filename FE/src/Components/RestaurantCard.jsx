function RestaurantCard({ rank, name, matchedMenus = [], groupOk, reason, quote, evidenceCount, scraped = false, onScrapToggle }) {
  return (
    <div
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: '1px solid #F0E4D8',
        borderRadius: 14,
        padding: 16,
      }}
    >
      <span
        onClick={onScrapToggle}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontSize: 16,
          color: scraped ? '#FF7A00' : '#8A7E76',
          cursor: 'pointer',
        }}
      >
        {scraped ? '♥' : '♡'}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span
          style={{
            background: rank === 1 ? '#FF7A00' : '#8A7E76',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#2B2320' }}>{name}</span>
        {matchedMenus.map((menu) => (
          <span
            key={menu}
            style={{
              fontSize: 11,
              background: '#FFF0E0',
              color: '#B35400',
              padding: '2px 8px',
              borderRadius: 8,
            }}
          >
            {menu}
          </span>
        ))}
        {groupOk && (
          <span
            style={{
              fontSize: 11,
              background: '#F0E4D8',
              color: '#8A7E76',
              padding: '2px 8px',
              borderRadius: 8,
            }}
          >
            단체가능
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#8A7E76', margin: '4px 0' }}>{reason}</p>

      {quote && (
        <p style={{ fontSize: 11, color: '#8A7E76', fontStyle: 'italic', margin: '0 0 6px' }}>
          "{quote}"
        </p>
      )}

      <span style={{ fontSize: 10, color: '#FF7A00' }}>근거 {evidenceCount}건</span>
    </div>
  );
}

export default RestaurantCard;