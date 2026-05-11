// @shared/lib/hooks/useLockBodyScroll.ts
import { useLayoutEffect } from "react";

export function useLockBodyScroll(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;

    // 1. Запоминаем текущую позицию скролла
    const scrollY = window.scrollY;

    // 2. Блокируем скролл + фиксируем позицию
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // 3. Возвращаем всё как было при размонтировании или locked=false
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
