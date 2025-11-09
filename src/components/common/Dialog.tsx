import { useMachine, normalizeProps } from "@zag-js/solid";
import * as dialog from "@zag-js/dialog";
import {
  Accessor,
  createContext,
  createMemo,
  createUniqueId,
  JSX,
  Show,
  useContext,
} from "solid-js";
import { createMutable } from "solid-js/store";
import { Portal } from "solid-js/web";

interface DialogParts {
  api: Accessor<ReturnType<typeof dialog.connect>>;
  trigger?: JSX.Element;
  title?: JSX.Element;
  contents?: JSX.Element;
  footer?: JSX.Element;
}
const DialogPartsContext = createContext<DialogParts>();

function Base(props: { onClose?: () => void; children: JSX.Element }) {
  const [state, send] = useMachine(
    dialog.machine({ id: createUniqueId(), onClose: props.onClose })
  );
  const api = createMemo(() => dialog.connect(state, send, normalizeProps));
  const parts = createMutable<DialogParts>({ api });

  return (
    <DialogPartsContext.Provider value={parts}>
      {props.children}
      <button {...api().triggerProps}>
        <Show when={parts.trigger}>{parts.trigger}</Show>
      </button>
      <Show when={api().isOpen}>
        <Portal>
          <div
            {...api().backdropProps}
            class="fixed inset-0 backdrop-blur-sm backdrop-brightness-90"
          />
          <div
            {...api().underlayProps}
            class="fixed inset-0 flex h-screen w-screen items-center justify-center"
          >
            <div
              {...api().contentProps}
              class="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-md border border-slate-300 bg-white"
            >
              {/* Sticky Header */}
              <div class="flex-shrink-0 border-b border-slate-200 px-8 pt-8 pb-4">
                <div {...api().titleProps} class="w-full">
                  <Show when={parts.title}>{parts.title}</Show>
                </div>
              </div>

              {/* Scrollable Content */}
              <div class="flex-1 overflow-y-auto px-8 py-4">
                <div {...api().descriptionProps} class="w-full">
                  <Show when={parts.contents}>{parts.contents}</Show>
                </div>
              </div>

              {/* Sticky Footer (if present) */}
              <Show when={parts.footer}>
                <div class="flex-shrink-0 border-t border-slate-200 px-8 pb-8 pt-4">
                  {parts.footer}
                </div>
              </Show>
            </div>
          </div>
        </Portal>
      </Show>
    </DialogPartsContext.Provider>
  );
}

function Trigger(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Trigger> used outside <Dialog>");
  }
  parts.trigger = props.children;
  return null;
}

function Title(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Title> used outside <Dialog>");
  }

  parts.title = props.children;
  return null;
}

function Contents(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Contents> used outside <Dialog>");
  }

  parts.contents = props.children;
  return null;
}

function Footer(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Footer> used outside <Dialog>");
  }

  parts.footer = props.children;
  return null;
}

function Close(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Close> used outside <Dialog>");
  }

  return <button {...parts.api().closeButtonProps}>{props.children}</button>;
}

function useDialogApi() {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("useDialogApi used outside <Dialog>");
  }
  return parts.api;
}

export const Dialog = Object.assign(Base, {
  Trigger,
  Title,
  Contents,
  Footer,
  Close,
  useDialogApi,
});
