/// <reference types="astro/astro-jsx" />

export function normalizeAstroClassListProps<
  T extends astroHTML.JSX.HTMLAttributes
>({
  class: className,
  "class:list": classList,
  ...props
}: T): Omit<T, "class" | "class:list"> & {
  classList: astroHTML.JSX.HTMLAttributes["class:list"];
} {
  return { classList: [className, classList], ...props };
}


export function normalizeSolidClass(
  localClass: string,
  externalClass?: string,
  prepend = true
) {
  return externalClass
    ? prepend
      ? externalClass + " " + localClass
      : localClass + " " + externalClass
    : localClass;
}
