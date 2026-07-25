/**
 * Button.jsx
 * Shared button primitive — two variants, gilt-accented.
 */

const VARIANTS = {
  // Solid gold ground; label flips dark in dark mode for contrast.
  primary: `
    bg-gilt-700 text-white dark:bg-gilt-400 dark:text-gray-950
    rounded-full px-6 py-2.5 font-semibold shadow-sm
    hover:-translate-y-0.5 hover:shadow-lg
  `,
  // Outline-only; gold appears on hover/focus, not at rest.
  ghost: `
    border border-hairline text-ink dark:text-white
    rounded-full px-6 py-2.5 font-semibold
    hover:border-gilt-600 hover:text-gilt-700
    dark:hover:border-gilt-400 dark:hover:text-gilt-400
  `,
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`transition disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
