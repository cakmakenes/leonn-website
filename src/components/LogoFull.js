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
 * `vertical` stacks the emblem above the wordmark for the splash screen; the
 * default is the horizontal lockup used in the navbar. Both are sized by
 * `font-size` on the element that receives `className`.
 */
export default function LogoFull({ className, vertical = false }) {
  const emblemSize = vertical ? "3.4em" : "1.9em";

  return (
    <span
      className={className}
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
          alignItems: vertical ? "center" : "flex-start",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-primary), sans-serif",
            fontWeight: 700,
            fontSize: "1.5em",
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}
        >
          LEONN
        </span>
        <span
          style={{
            fontFamily: "var(--font-primary), sans-serif",
            fontWeight: 300,
            fontSize: "0.62em",
            letterSpacing: "0.42em",
            // The wide tracking would otherwise push the word off-centre to the
            // right; nudge it back so it sits under the "LEONN" cap height.
            marginLeft: vertical ? "0.42em" : "0.1em",
            marginTop: "0.28em",
          }}
        >
          RESTAURANT
        </span>
      </span>
    </span>
  );
}
