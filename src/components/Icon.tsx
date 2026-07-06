import type { CSSProperties } from "react";

type IconProps = {
  name: string;
  className?: string;
  fill?: boolean;
  style?: CSSProperties;
};

/** Material Symbols Outlined icon helper. */
export default function Icon({ name, className = "", fill = false, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined${fill ? " fill" : ""}${
        className ? " " + className : ""
      }`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
