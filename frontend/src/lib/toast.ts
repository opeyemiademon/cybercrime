import { toast } from "sonner";

type ToastKind = "success" | "error" | "warning" | "info";

export function notify(kind: ToastKind, title: string, description?: string) {
  const base = { description };

  if (kind === "success") return toast.success(title, base);
  if (kind === "error") return toast.error(title, base);
  if (kind === "warning") return toast.warning(title, base);
  return toast.message(title, base);
}
