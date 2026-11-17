import { useId } from "react";

/**
 * Decorative panel of "adire" (Yoruba indigo resist-dyed cloth), drawn in SVG.
 * White resist motifs on indigo, in a grid of panels with uneven, hand-made edges.
 * Motifs: tie-dye rosette (oniko), double spiral, stitched lines (alabere),
 * checkerboard, diamond, waves, leaf and star.
 * It is purely decorative, so it is hidden from screen readers.
 */
const INK = "#EEF1FB";
const EDGE = "#DDE3F7";
// Which motif goes in each of the 12 panels (4 columns x 3 rows)
const ORDER = [1, 3, 6, 2, 7, 4, 1, 5, 5, 2, 8, 3];

const AdireCloth = ({ className }: { className?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const stroke = { fill: "none", stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const };
  const frame = <rect width="160" height="160" fill="none" stroke={EDGE} strokeWidth="3" />;

  return (
    <svg
      className={className}
      viewBox="0 0 700 540"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Wobbly edges, like paste applied by hand */}
        <filter id={id("wobble")}>
          <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
        {/* Uneven dye: darker patches in the indigo */}
        <filter id={id("mottle")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="3" seed="9" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 .1 0 0 0 0 .05 1.4 0 0 0 -.35" />
        </filter>
        <linearGradient id={id("fade")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".3" stopColor="#fff" />
        </linearGradient>
        <mask id={id("mask")}>
          <rect width="700" height="540" fill={`url(#${id("fade")})`} />
        </mask>

        <g id={id("m1")}>
          {frame}
          <g fill="none" stroke={INK} strokeWidth="6">
            <circle cx="80" cy="80" r="9" fill={INK} />
            <circle cx="80" cy="80" r="26" />
            <circle cx="80" cy="80" r="44" strokeDasharray="4 9" strokeLinecap="round" />
            <circle cx="80" cy="80" r="62" />
          </g>
        </g>
        <g id={id("m2")}>
          {frame}
          <path
            {...stroke}
            d="M80,80 a6,6 0 1 1 12,0 a18,18 0 1 1 -36,0 a30,30 0 1 1 60,0 a42,42 0 1 1 -84,0 a54,54 0 1 1 108,0"
          />
        </g>
        <g id={id("m3")}>
          {frame}
          <path
            fill={INK}
            d="M20,20h30v30h-30z M80,20h30v30h-30z M50,50h30v30h-30z M110,50h30v30h-30z M20,80h30v30h-30z M80,80h30v30h-30z M50,110h30v30h-30z M110,110h30v30h-30z"
          />
        </g>
        <g id={id("m4")}>
          {frame}
          <path
            {...stroke}
            strokeLinejoin="round"
            d="M80,14 L146,80 L80,146 L14,80 Z M80,42 L118,80 L80,118 L42,80 Z"
          />
          <circle cx="80" cy="80" r="9" fill={INK} />
        </g>
        <g id={id("m5")}>
          {frame}
          <path
            {...stroke}
            d="M10,36 q17,-18 35,0 t35,0 t35,0 t35,0 M10,68 q17,-18 35,0 t35,0 t35,0 t35,0 M10,100 q17,-18 35,0 t35,0 t35,0 t35,0 M10,132 q17,-18 35,0 t35,0 t35,0 t35,0"
          />
        </g>
        <g id={id("m6")}>
          {frame}
          <path
            {...stroke}
            strokeWidth={5}
            strokeDasharray="12 8"
            d="M20,28 H140 M20,50 H140 M20,72 H140 M20,94 H140 M20,116 H140 M20,138 H140"
          />
        </g>
        <g id={id("m7")}>
          {frame}
          <path
            {...stroke}
            strokeWidth={4}
            strokeLinejoin="round"
            d="M80,18 C130,50 130,110 80,142 C30,110 30,50 80,18 Z M80,32 V130 M80,60 L108,42 M80,60 L52,42 M80,84 L112,66 M80,84 L48,66 M80,108 L106,92 M80,108 L54,92"
          />
        </g>
        <g id={id("m8")}>
          {frame}
          <path {...stroke} d="M80,16 V144 M16,80 H144 M34,34 L126,126 M126,34 L34,126" />
          <circle cx="80" cy="80" r="14" fill="#006B3F" stroke={INK} strokeWidth="6" />
        </g>
      </defs>

      <g mask={`url(#${id("mask")})`}>
        <rect width="700" height="540" filter={`url(#${id("mottle")})`} />
        <g filter={`url(#${id("wobble")})`}>
          {ORDER.map((m, i) => (
            <use key={i} href={`#${id(`m${m}`)}`} x={10 + (i % 4) * 172} y={12 + Math.floor(i / 4) * 172} />
          ))}
        </g>
      </g>
    </svg>
  );
};

export default AdireCloth;
