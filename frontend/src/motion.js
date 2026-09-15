// Shared motion vocabulary, so every page moves the same way.
// Calm and quick: nothing over 250ms, no bounce. Curves match the CSS tokens in styles.css
// (--ease-out, --ease-in-out). MotionConfig reducedMotion="user" turns movement into fades for
// people who ask for less motion.

export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
};

// Things settling into place: the sidebar's active fill, the tab underline sliding
export const settle = { type: "spring", duration: 0.35, bounce: 0 };

// A card or row entering a list. `i` staggers a group that arrives together (capped so long lists don't drag).
export const enter = (i = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.out, delay: Math.min(i, 8) * 0.025 } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: ease.out } },
});

// One piece of UI replacing another in the same spot (a button becoming a status line, a status tag changing).
export const swap = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: ease.out } },
};

// The detail panel crossfading when the selected item changes
export const panelSwap = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: ease.out } },
};

// The inline composer opening inside the detail panel
export const popover = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, y: -2, transition: { duration: 0.1, ease: ease.out } },
};

// Messages that slide in under the page heading
export const notice = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: ease.out } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: ease.out } },
};
