function MenuChip({ label, selected = false, onClick, removable = false }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 12,
        cursor: 'pointer',
        background: selected ? '#FF7A00' : '#FFFFFF',
        color: selected ? '#fff' : '#2B2320',
        border: selected ? 'none' : '1px solid #F0E4D8',
      }}
    >
      {label} {removable && '✕'}
    </span>
  );
}

export default MenuChip;