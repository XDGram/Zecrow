/** Compact crow profile for the Zecrow wordmark. */
export default function ZecrowMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Zecrow crow mark"
    >
      <path
        d="M6 25.2C8.2 18.1 14.2 13.2 21.6 12.6C24.5 9.1 31.5 9.3 35.1 14.2L45.5 18.8L37.4 22.4L34.6 28.3C32.5 34.3 25.8 37 19.3 33.8L11.4 39L12.8 30.9C9.4 29.8 7.1 27.8 6 25.2Z"
        fill="#0b0b0d"
      />
      <path
        d="M17.3 27.2C20.8 29.7 25.8 30 29.8 28.2"
        stroke="#ffffff"
        strokeOpacity="0.72"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="29.2" cy="18.1" r="1.55" fill="#e9a21a" />
    </svg>
  );
}
