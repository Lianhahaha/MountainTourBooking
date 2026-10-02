// One stroke icon set for the public site: 24px grid, 1.75 stroke, round joins.
const paths = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  minus: "M6 12h12",
  sun: "M12 4v1.5M12 18.5V20M4 12h1.5M18.5 12H20M6.3 6.3l1.1 1.1M16.6 16.6l1.1 1.1M6.3 17.7l1.1-1.1M16.6 7.4l1.1-1.1M15.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z",
  moon: "M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z",
  monitor: "M4 5h16v11H4zM9 20h6M12 16v4",
  peak: "M3 19l6.5-11 3.5 6 2-3 6 8z",
  route: "M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9.5A3.5 3.5 0 019.5 6H11M18 9v5.5a3.5 3.5 0 01-3.5 3.5H13",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2",
  calendar: "M5 6h14v14H5zM5 10h14M9 4v4M15 4v4",
  thermo: "M10 14.5V5a2 2 0 114 0v9.5a4 4 0 11-4 0zM12 11v6",
  gauge: "M4 18a8 8 0 1116 0M12 18l3.5-5",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3.5 19a5.5 5.5 0 0111 0M16 11a2.5 2.5 0 100-5M17.5 19H20.5a4.5 4.5 0 00-4.5-4.5",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M6.5 3.5h3l1.5 4-2 1.5a10 10 0 005.5 5.5l1.5-2 4 1.5v3a2 2 0 01-2 2A15.5 15.5 0 014.5 5.5a2 2 0 012-2z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  chat: "M5 5h14v10H10l-4 4v-4H5z",
  camera: "M4 8h3.5L9 6h6l1.5 2H20v11H4zM12 16.5a3 3 0 100-6 3 3 0 000 6z",
  star: "M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z",
  chevronDown: "M6 9l6 6 6-6",
  external: "M14 5h5v5M19 5l-8 8M17 14v5H5V7h5",
  backpack: "M8 7V5.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V7M6 9a2 2 0 012-2h8a2 2 0 012 2v11H6zM9 13h6M9 16.5h6",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 15.5h5",
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "h-4 w-4",
  title,
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={paths[name]} />
    </svg>
  );
}
