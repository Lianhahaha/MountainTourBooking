"use client";

/**
 * Last-resort boundary: the root layout itself failed, so this page cannot
 * rely on it, the fonts, or the CSS variables.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#0d1117",
          color: "#e6edf3",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "26rem",
            padding: "1.5rem",
            border: "1px solid #30363d",
            borderRadius: 6,
            background: "#161b22",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>The site hit a problem</h1>
          <p style={{ margin: "0.5rem 0 0", color: "#8b949e", fontSize: "0.9375rem" }}>
            Reload the page, or come back in a moment. If you were booking a climb, your
            request was not lost — message us and we will check it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              border: 0,
              borderRadius: 6,
              background: "#238636",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
