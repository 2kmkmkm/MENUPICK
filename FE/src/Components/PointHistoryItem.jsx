function PointHistoryItem({ label, date, delta }) {
  const positive = delta > 0;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '0.5px solid #F0E4D8',
      }}
    >
      <div>
        <p style={{ fontSize: 13, color: '#2B2320', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: '#8A7E76', margin: '2px 0 0' }}>{date}</p>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: positive ? '#FF7A00' : '#8A7E76' }}>
        {positive ? '+' : ''}{delta}P
      </span>
    </div>
  );
}

export default PointHistoryItem;