export default function normalizeSolidClass(
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
