import logo from "@/assets/logo.png"

// Fixed dark panel — the auth experience is always dark, independent of the
// app's own (not-yet-wired) theme toggle, same as the reference this was
// benchmarked against. Swap <LedgerRows /> for a full-bleed <img>/
// background-image (keep the bottom gradient on top for legibility) once a
// real product photograph is available.
export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-[42%] max-w-xl shrink-0 flex-col justify-between p-12 overflow-hidden lg:flex">
      <Glow />
      <LedgerRows />

      <div className="relative z-10">
        <img
          src={logo}
          alt="Time Trackr"
          className="w-64 mix-blend-screen xl:w-72"
        />
      </div>

      <div className="relative z-10 max-w-sm">
        <p className="text-2xl leading-snug font-medium text-foreground">
          One accurate record of hours, for everyone who needs to trust it.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Time Trackr replaces spreadsheets with a single place to track,
          approve, and report on time — built for teams, not just
          individuals.
        </p>
      </div>
    </div>
  )
}

function Glow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[124px]"
      style={{ backgroundColor: "oklch(0.58 0.18 255)" }}
    />
  )
}

function LedgerRows() {
  const rows = [
    { width: "82%" },
    { width: "94%" },
    { width: "62%", accent: true },
    { width: "88%" },
    { width: "70%" },
    { width: "96%" },
    { width: "54%" },
    { width: "84%" },
    { width: "66%", accent: true },
    { width: "76%" },
    { width: "90%" },
    { width: "58%" },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-5 px-12"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 39px, oklch(1 0 0 / 5%) 40px)",
      }}
    >
      {rows.map((row, index) => (
        <div
          key={index}
          className="h-2.5 rounded-full"
          style={{
            width: row.width,
            maxWidth: "24rem",
            backgroundColor: row.accent
              ? "oklch(0.7 0.16 255 / 65%)"
              : "oklch(1 0 0 / 12%)",
          }}
        />
      ))}
    </div>
  )
}
