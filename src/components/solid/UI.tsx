import { children, For, splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import normalizeSolidClass from "~utils/normalizeSolidClass";

interface LabelContainerProps {
  containerClass?: JSX.LabelHTMLAttributes<HTMLLabelElement>["class"];
  containerClassList?: JSX.LabelHTMLAttributes<HTMLLabelElement>["classList"];
}

interface BaseInputProps {
  name: string;
}
interface BaseInputProps extends LabelContainerProps {}
interface BaseInputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export interface InputProps extends Omit<BaseInputProps, "onInput"> {
  onInput: (value: string | number) => void;
  type: "number" | "text";
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "containerClass",
    "containerClassList",
    "onInput",
    "type",
  ]);
  const resolved = children(() => local.children);
  return (
    <div
      class={local.containerClass ?? ""}
      classList={local.containerClassList ?? {}}
    >
      <label for={props.id ?? props.name}>{resolved()}</label>
      <input
        {...rest}
        id={props.id ?? props.name}
        onInput={(event) =>
          local.onInput(
            local.type === "number"
              ? event.currentTarget.valueAsNumber
              : event.currentTarget.value
          )
        }
        type={local.type}
      />
    </div>
  );
}

export interface RangeInputProps
  extends Omit<BaseInputProps, "onChange" | "type"> {
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function RangeInput(props: RangeInputProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "containerClass",
    "containerClassList",
    "max",
    "min",
    "onChange",
  ]);
  const resolved = children(() => local.children);
  // FIXME Had to resort to this hack in the meantime because SSR in Astro is breaking something in Solid
  const input = children(() => (
    <>
      <span class="cursor-pointer" onClick={() => local.onChange(local.min)}>
        {local.min}
      </span>
      <input
        {...rest}
        class="rounded-md py-1 accent-purple-600 ring-black/75 transition duration-300 focus:outline-none focus-visible:ring dark:ring-white/75"
        id={props.id ?? props.name}
        max={local.max}
        min={local.min}
        onChange={(event) => local.onChange(event.currentTarget.valueAsNumber)}
        type="range"
      />
      <span class="cursor-pointer" onClick={() => local.onChange(local.max)}>
        {local.max}
      </span>
    </>
  ));
  return (
    <label
      class={local.containerClass ?? ""}
      classList={{
        ...(local.containerClassList ?? {}),
        "cursor-pointer": !rest.disabled,
      }}
      for={props.id ?? props.name}
    >
      <span>{resolved()}</span>
      <span class="flex items-center space-x-2">{input()}</span>
    </label>
  );
}

export interface CheckableProps
  extends Omit<BaseInputProps, "onChange" | "type"> {
  checked: boolean;
  onChange: (value: boolean) => void;
  type: "checkbox" | "radio";
}

export function Checkable(props: CheckableProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "containerClass",
    "containerClassList",
    "onChange",
    "type",
  ]);
  const resolved = children(() => local.children);
  const input = children(() => (
    <input
      {...rest}
      class="h-4 w-4 rounded-md accent-purple-600 ring-black/75 transition duration-300 focus:outline-none focus-visible:ring dark:ring-white/75"
      id={props.id ?? props.name}
      onChange={(event) => local.onChange(event.currentTarget.checked)}
      type={local.type}
    />
  ));
  return (
    <label
      class={local.containerClass ?? ""}
      classList={{
        ...(local.containerClassList ?? {}),
        "cursor-pointer": !rest.disabled,
        "cursor-not-allowed": rest.disabled,
      }}
      for={props.id ?? props.name}
    >
      <span>{resolved()}</span>
      {input()}
    </label>
  );
}

export type Option = {
  disabled?: boolean;
  label: string;
  value: string | number;
};

export interface SelectProps extends LabelContainerProps {}
export interface SelectProps
  extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {}
export interface SelectProps {
  name: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "containerClass",
    "containerClassList",
    "onChange",
    "options",
  ]);
  const resolved = children(() => local.children);
  // FIXME Had to resort to this hack in the meantime because SSR in Astro is breaking something in Solid
  const select = children(() => (
    <select
      {...rest}
      class={normalizeSolidClass(
        "rounded-md bg-purple-700 p-2 font-bold text-white ring-black/75 transition duration-300 scrollbar scrollbar-thin scrollbar-thumb-white scrollbar-track-purple-600 hover:bg-purple-600 focus:outline-none focus-visible:bg-purple-600 focus-visible:ring dark:ring-white/75",
        local.class
      )}
      classList={{
        ...(rest.classList ?? {}),
        "cursor-pointer": !rest.disabled,
        "cursor-not-allowed": rest.disabled,
      }}
      id={props.id ?? props.name}
      onChange={(event) => local.onChange(event.currentTarget.value)}
    >
      <For each={local.options}>
        {(option) => (
          <option disabled={option.disabled ?? false} value={option.value}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  ));
  return (
    <label
      class={local.containerClass ?? ""}
      classList={local.containerClassList ?? {}}
      for={props.id ?? props.name}
    >
      <span>{resolved()}</span>
      {select()}
    </label>
  );
}

export interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  custom?: boolean;
  loading?: boolean;
  icon?: boolean;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "custom",
    "icon",
  ]);
  const resolved = children(() => local.children);
  return (
    <button
      {...rest}
      class={normalizeSolidClass(
        "rounded-md font-bold text-white ring-black/75 transition duration-300 focus:outline-none focus-visible:ring dark:ring-white/75",
        local.class
      )}
      classList={{
        ...(rest.classList ?? {}),
        "py-1.5 px-4": !local.icon,
        "p-2": local.icon,
        "bg-purple-700 enabled:hover:bg-purple-600 enabled:focus-visible:bg-purple-600 disabled:bg-neutral-600":
          !local.custom,
        "cursor-pointer": !rest.disabled && !rest.loading,
        "cursor-not-allowed": rest.disabled,
        "cursor-wait": rest.loading,
      }}
      disabled={rest.disabled ?? rest.loading ?? false}
    >
      <span>{resolved()}</span>
    </button>
  );
}

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const resolved = children(() => local.children);
  return (
    <div
      {...rest}
      class={
        "rounded-lg border border-neutral-400/50 bg-white shadow transition duration-300 dark:bg-neutral-800 dark:text-white/80 dark:shadow-md dark:shadow-neutral-700/30" +
        (local.class ? ` ${local.class}` : "")
      }
    >
      {resolved()}
    </div>
  );
}
