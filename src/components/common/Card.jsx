/**
 * Card.jsx
 * Shared surface container — one radius/border language app-wide.
 */

export function Card({ hoverable = false, className = "", children, ...rest }) {
  return (
    <div
      className={`
        bg-surface dark:bg-gray-900
        border border-hairline dark:border-gray-700
        rounded-2xl shadow-sm transition-all duration-300
        ${hoverable ? "hover:-translate-y-0.5 hover:shadow-lg" : ""}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
