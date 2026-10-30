import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "./location";

export function AppLink({ href = "/", onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target || props.download) return;
    const target = new URL(href, window.location.origin);
    if (target.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(href);
  }
  return <a {...props} href={href} onClick={follow}>{children}</a>;
}
