export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  // Calculate 2% of viewBox width (500)
  const moveRightBy = 500 * 0.02;

  return (
    <svg aria-hidden="true" viewBox="0 0 500 250" {...props}>
      {/* Outer Circle */}
      <circle cx="125" cy="125" r="100" fill="#6A5ACD" stroke="#6A5ACD" strokeWidth="15" />

      {/* Inner Circle */}
      <circle cx="125" cy="125" r="90" fill="white" stroke="#6A5ACD" strokeWidth="15" />

      {/* Letter M */}
      <text x="70" y="155" fontSize="70" fontFamily="Arial" fontWeight="900" fill="#6A5ACD">
        M
      </text>

      {/* Letter D */}
      <text x={122.5 + moveRightBy} y="155" fontSize="70" fontFamily="Arial" fontWeight="900" fill="#6A5ACD">
        D
      </text>
    </svg>
  );
}
