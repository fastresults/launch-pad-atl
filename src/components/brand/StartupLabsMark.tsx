type Props = {
  className?: string;
  title?: string;
};

/**
 * Compact StartupLabs leaf mark — used where the full wordmark won't fit
 * (e.g. collapsed sidebars, favicons). Gradient is theme-agnostic and works
 * in both light and dark mode.
 */
export function StartupLabsMark({ className, title = "StartupLabs" }: Props) {
  return (
    <svg
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 174.28 174.28"
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="sl-mark-leaf"
          x1="0"
          y1="87.14"
          x2="174.28"
          y2="87.14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#d08c00" />
          <stop offset="1" stopColor="#628acf" />
        </linearGradient>
      </defs>
      <path
        fill="url(#sl-mark-leaf)"
        d="M148.76,25.52C114.73-8.51,59.55-8.51,25.52,25.52.27,50.78-6.24,87.67,5.98,118.93l6.21-6.21c8.51-8.51,20.94-11.57,32.43-7.97,3.67,1.15.47.17,18.52,5.66,14.45,3.33,29.15-.34,42.12-13.31,12.27-12.27,13.16-23.6,14.03-41.88-19.79.58-30.14,1.82-43.77,15.45-7.63,7.63-12.1,17.5-12.97,27.83l-14.63-4.26c2-14.64,8.38-25.62,18.43-35.68,19.98-19.98,40.56-17.78,68.81-19-1.87,34.8-.27,49.19-20.93,69.85-12.4,12.4-29.37,18.42-46.36,16.94-20.49-4.68-14.6-3.13-27.75-7.24-6.13-1.92-12.76-.29-17.3,4.25l-9.75,9.75c6.83,10.99,16.38,20.8,28.09,28.09l9.3-9.3c4.13-4.13,5.84-9.98,4.68-15.61l15.41,2.99c.24,15.33-9.11,22.93-15.21,29.02,31.26,12.22,68.15,5.72,93.41-19.54,34.03-34.03,34.03-89.21,0-123.24Z"
      />
    </svg>
  );
}
