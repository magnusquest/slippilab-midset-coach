import { JSX, splitProps } from "solid-js";

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton(props: ButtonProps) {
  const [local, otherProps] = splitProps(props, ["class", "type"]);
  return (
    <button
      type={local.type ?? "button"}
      {...otherProps}
      class={`inline-flex w-fit items-center rounded-md border border-transparent bg-slippi-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slippi-500 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 ${
        local.class ?? ""
      }`}
    >
      {props.children}
    </button>
  );
}

export function SecondaryButton(props: ButtonProps) {
  const [local, otherProps] = splitProps(props, ["class", "type"]);
  return (
    <button
      type={local.type ?? "button"}
      {...otherProps}
      class={`inline-flex w-fit items-center rounded-md border border-transparent bg-slippi-100 px-4 py-2 text-sm font-medium text-slippi-700 hover:bg-slippi-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 ${
        local.class ?? ""
      }`}
    >
      {props.children}
    </button>
  );
}

export function WhiteButton(props: ButtonProps) {
  const [local, otherProps] = splitProps(props, ["class", "type"]);
  return (
    <button
      type={local.type ?? "button"}
      {...otherProps}
      class={`inline-flex w-fit items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slippi-500 focus:ring-offset-2 ${
        local.class ?? ""
      }`}
    >
      {props.children}
    </button>
  );
}
