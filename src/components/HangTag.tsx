import { cn } from "@/lib/utils";

type TagSize = "sm" | "md" | "lg";

/**
 * Gear hang tag shell: chamfered card stock with a punched hole and eyelet.
 * `string` draws the tag's cord running out through the hole.
 */
export function HangTag({
  size = "md",
  variant,
  centerHole = false,
  string = false,
  className,
  faceClassName,
  children,
}: {
  size?: TagSize;
  variant?: "private";
  centerHole?: boolean;
  string?: boolean;
  className?: string;
  faceClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("tag-wrap", className)}>
      <div
        className={cn(
          "tag",
          size === "lg" && "tag--lg",
          size === "sm" && "tag--sm",
          centerHole && "tag--center",
          variant === "private" && "tag--private"
        )}
      >
        <div className={cn("tag-face", faceClassName)}>{children}</div>
      </div>
      {string && <TagString />}
    </div>
  );
}

/** Cord from the hole of a large tag, looping up and out of frame. */
function TagString() {
  return (
    <svg
      className="pointer-events-none absolute -top-10 left-[17px] h-[70px] w-[60px] text-muted/70"
      viewBox="0 0 60 70"
      fill="none"
      aria-hidden
    >
      <path
        d="M11 68 C 3 52, 1 32, 14 18 S 40 2, 58 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 68 C 19 56, 25 42, 23 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
