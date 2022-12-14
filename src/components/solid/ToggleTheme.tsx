import {
  animateEnter,
  animateExit,
  TransitionGroup,
} from "@otonashixav/solid-flip";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import { IS_IN_CLIENT } from "~constants/env";
import { SolidMoonIcon, SolidSunIcon } from "./Icons";

export function ToggleTheme() {
  const [darkMode, setDarkMode] = createSignal(false);
  onMount(() => {
    if (IS_IN_CLIENT) {
      if (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        setDarkMode(true);
      }
    }
  });

  createEffect(() => {
    if (IS_IN_CLIENT) {
      if (darkMode()) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
        localStorage.theme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        localStorage.theme = "light";
      }
    }
  });

  return (
    <div class="absolute top-1 right-0">
      <button
        class="relative rounded-lg p-1 ring-black/75 transition duration-300 focus:outline-none focus-visible:ring dark:ring-white/75"
        onClick={() => setDarkMode((prev) => !prev)}
      >
        <TransitionGroup
          enter={animateEnter(
            {
              keyframes: [{ opacity: 0 }, { opacity: 1 }],
              options: {
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              },
            },
            { unabsolute: false, reverseExit: true }
          )}
          exit={animateExit(
            {
              keyframes: [{ opacity: 1 }, { opacity: 0 }],
              options: {
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              },
            },
            { absolute: true, reverseEnter: true }
          )}
        >
          <Show when={darkMode()} fallback={<SolidMoonIcon />}>
            <SolidSunIcon />
          </Show>
        </TransitionGroup>
      </button>
    </div>
  );
}
