/**
 * Input.jsx
 * Shared text input primitive with gilt focus state.
 */

export function Input({ className = "", ...rest }) {
  return (
    <input
      className={`
        w-full rounded-xl px-3 py-2 text-sm
        border border-hairline dark:border-gray-700
        bg-white dark:bg-gray-800 text-ink dark:text-white
        focus:outline-none focus:border-gilt-600 focus:ring-2 focus:ring-gilt-100
        ${className}
      `}
      {...rest}
    />
  );
}
