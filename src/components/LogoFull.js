import Logo from "./Logo";

/**
 * Full brand lockup: the lion-shield emblem with the "LEONN / RESTAURANT"
 * wordmark, matching the logo in the brand guide.
 *
 * Why not the supplied SVG (public/leonn-logo-horizontal.svg): its wordmark is
 * live <text> set in "GravesendSans", a font that is not installed, so browsers
 * would substitute an arbitrary typeface. Rendering the emblem as a vector and
 * setting the wordmark in the site's own fonts keeps it crisp at any size and
 * lets the whole lockup inherit `currentColor` (gold in the navbar, whatever
 * the context needs elsewhere).
 *
 * "RESTAURANT" is spread letter by letter so it starts and ends exactly under
 * "LEONN", as in the brand logo. Plain letter-spacing cannot guarantee that.
 *
 * `vertical` stacks the emblem above the wordmark for the splash screen; the
 * default is the horizontal lockup used in the navbar. Both are sized by
 * `font-size` on the element that receives `className`.
 */
export default function LogoFull({ className, vertical = false }) {
  const emblemSize = vertical ? "3.4em" : "1.9em";

  return (
    <span
      className={className}
      role="img"
      aria-label="Leonn Restaurant"
      style={{
        display: "inline-flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: vertical ? "0.35em" : "0.6em",
        color: "inherit",
        lineHeight: 1,
      }}
    >
      <Logo style={{ height: emblemSize, width: "auto", flexShrink: 0 }} />
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-primary), sans-serif",
            fontWeight: 700,
            fontSize: "1.5em",
            letterSpacing: "0.06em",
            // Cancels the tracking after the last N, so the block ends on the glyph.
            marginRight: "-0.06em",
            lineHeight: 1,
          }}
        >
          LEONN
        </span>
        <span
          style={{
            display: "flex",
            justifyContent: "space-between",
            // Takes its width from "LEONN" without widening the block itself.
            width: 0,
            minWidth: "100%",
            fontFamily: "var(--font-primary), sans-serif",
            fontWeight: 300,
            fontSize: "0.62em",
            marginTop: "0.28em",
          }}
        >
          {[..."RESTAURANT"].map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </span>
      </span>
    </span>
  );
}
