function Button({ children, onClick, variant = 'primary', disabled = false }) {
  const styles = {
    primary: {
      background: '#FF7A00',
      color: '#fff',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: '#2B2320',
      border: '1px solid #F0E4D8',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        width: '100%',
        height: 48,
        borderRadius: 14,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default Button;