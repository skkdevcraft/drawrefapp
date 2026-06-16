/**
 * Application SVG Icons
 *
 * Every inline SVG used throughout the application is defined here and
 * exported as a named constant. Import these icons instead of inlining
 * SVGs in component or module files.
 *
 * Each SVG should be kept small and use `currentColor` for stroke/fill
 * so it inherits the surrounding text colour.
 */

/* ── Toggle Button Icons ──────────────────────────── */

/** Gear icon for the settings toggle button. */
export const GEAR_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
`.trim();

/** Open eye icon for the model visibility toggle. */
export const EYE_OPEN_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`.trim();

/** Closed eye icon for the model visibility toggle. */
export const EYE_CLOSED_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
`.trim();

/* ── Button Position Icons ────────────────────────── */

/** Square with a dot in the top-left corner — for button position selection. */
export const ICON_TL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="4" fill="currentColor" stroke="none"/></svg>`;

/** Square with a dot in the top-right corner — for button position selection. */
export const ICON_TR = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="15" cy="9" r="4" fill="currentColor" stroke="none"/></svg>`;

/** Square with a dot in the bottom-left corner — for button position selection. */
export const ICON_BL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="15" r="4" fill="currentColor" stroke="none"/></svg>`;

/** Square with a dot in the bottom-right corner — for button position selection. */
export const ICON_BR = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="15" cy="15" r="4" fill="currentColor" stroke="none"/></svg>`;

/* ── Model Thumbnail Icons ────────────────────────── */

/** Stylised skull icon for the skull model button. */
export const SKULL_THUMBNAIL = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="1176.000000pt" height="1280.000000pt" viewBox="0 0 1176.000000 1280.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M5495 12774 c-106 -21 -174 -25 -590 -38 -512 -17 -586 -23 -995 -90
-746 -122 -1023 -202 -1466 -424 -534 -267 -988 -622 -1323 -1032 -221 -270
-375 -530 -525 -882 -41 -97 -127 -290 -191 -428 -170 -369 -219 -498 -280
-740 -155 -618 -164 -1276 -30 -2142 99 -638 316 -1097 700 -1483 154 -155
280 -253 577 -447 73 -48 255 -180 403 -294 149 -113 311 -235 362 -271 353
-246 729 -422 1123 -526 148 -39 162 -41 310 -41 133 -1 166 3 235 22 115 33
204 79 340 175 190 135 387 223 620 278 130 30 287 33 327 6 37 -25 58 -85 58
-165 0 -75 -107 -754 -178 -1132 -40 -216 -46 -262 -46 -385 -1 -153 12 -223
64 -366 133 -364 498 -675 875 -744 22 -5 211 -9 420 -10 492 -3 632 -21 825
-104 117 -50 192 -104 329 -235 329 -313 603 -508 1234 -875 339 -198 464
-261 616 -311 205 -69 299 -84 521 -84 260 0 366 25 460 110 98 88 120 187
124 549 4 283 9 321 67 444 43 93 110 182 187 248 135 117 206 196 249 278 48
93 89 219 105 320 10 64 9 75 -10 118 -15 34 -34 55 -67 76 -31 20 -303 116
-779 274 -1775 594 -1914 646 -2148 819 -100 73 -227 212 -271 296 -52 98 -56
146 -22 247 26 80 193 414 222 447 42 47 82 24 83 -47 0 -62 -36 -260 -66
-360 -64 -215 -63 -290 5 -369 47 -54 312 -232 426 -286 284 -134 838 -265
2075 -489 602 -110 645 -116 720 -101 160 31 206 151 165 430 -30 208 -65 322
-183 615 -118 292 -164 488 -165 710 -1 220 33 360 143 595 85 183 155 367
170 449 6 34 9 65 7 68 -9 8 -122 -55 -148 -84 -14 -15 -123 -152 -241 -303
-233 -297 -290 -360 -304 -338 -5 7 -8 56 -8 108 2 115 22 181 101 329 124
231 263 411 405 525 145 117 238 161 461 216 67 17 137 36 155 41 l32 11 0 71
0 72 -63 34 c-34 19 -118 71 -187 116 -282 187 -415 365 -470 629 -91 442 -91
766 -1 1136 52 210 64 321 58 525 -6 199 -10 221 -101 555 -80 298 -111 425
-145 606 -79 410 -205 734 -407 1040 -162 246 -395 492 -669 705 -83 64 -199
160 -260 213 -136 120 -376 306 -512 397 -130 88 -253 152 -428 227 -402 170
-727 260 -1535 422 l-495 100 -465 -1 c-447 -1 -470 -2 -585 -25z m4665 -4244
c42 -42 31 -77 -118 -382 -137 -278 -155 -335 -150 -460 4 -115 26 -167 123
-288 138 -172 176 -304 176 -610 0 -313 -27 -389 -145 -421 -56 -15 -202 -5
-296 21 -115 33 -185 75 -281 170 -131 130 -198 258 -286 544 -41 135 -45 156
-41 225 l5 76 143 255 c163 291 366 632 437 735 38 55 59 75 103 97 108 56
292 76 330 38z m-3427 -2104 c63 -23 102 -61 181 -179 134 -203 223 -260 467
-302 295 -50 570 -168 1089 -466 129 -75 275 -158 324 -185 49 -27 106 -66
127 -86 65 -64 62 -135 -9 -169 -33 -16 -204 -12 -612 16 -238 17 -246 18
-278 44 -225 180 -373 247 -572 258 -177 9 -343 -34 -545 -143 -44 -23 -135
-65 -202 -93 l-123 -50 -112 51 c-141 64 -196 96 -276 162 -212 171 -364 456
-436 819 -49 243 -30 275 57 96 65 -133 149 -199 257 -199 108 0 179 50 295
205 84 112 140 167 205 200 71 37 106 41 163 21z"/>
</g>
</svg>`;

/** Stylised head icon (profile/side view) for the head model button. */
export const HEAD_THUMBNAIL = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="1280.000000pt" height="1280.000000pt" viewBox="0 0 1280.000000 1280.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M6065 10803 c-402 -26 -837 -106 -1175 -216 -343 -112 -669 -271
-945 -458 -899 -611 -1488 -1669 -1567 -2817 -14 -203 -1 -409 32 -532 11 -41
30 -109 41 -150 28 -104 35 -256 16 -347 -44 -203 -142 -356 -457 -708 -441
-494 -573 -700 -574 -900 -1 -57 4 -80 27 -127 44 -91 81 -111 407 -228 157
-56 288 -105 293 -109 9 -9 -24 -152 -90 -391 -25 -91 -46 -187 -46 -215 -1
-73 20 -98 122 -146 167 -76 176 -82 179 -110 2 -20 -6 -34 -35 -59 -59 -51
-83 -97 -83 -157 0 -66 18 -113 92 -235 79 -131 126 -232 138 -299 10 -51 8
-63 -16 -125 -87 -230 -88 -232 -88 -349 0 -134 16 -198 89 -351 45 -93 64
-120 117 -170 114 -106 287 -180 535 -228 177 -34 347 -53 708 -76 588 -38
676 -55 775 -151 149 -145 267 -466 335 -912 15 -94 29 -182 31 -194 l4 -23
2728 0 2727 0 -72 40 c-425 231 -675 579 -814 1130 -76 301 -114 646 -107 982
6 252 23 364 84 540 68 195 142 325 431 758 406 609 571 889 838 1415 345 682
440 951 501 1420 22 162 24 559 5 725 -132 1160 -824 2230 -1906 2945 -358
236 -736 419 -1161 561 -428 143 -853 228 -1323 264 -121 9 -669 11 -796 3z"/>
</g>
</svg>`;
