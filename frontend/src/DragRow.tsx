import React, { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function DragRow({ children, style, contentContainerStyle }: Props) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current?.getScrollableNode?.() ?? ref.current;
    const win = (globalThis as any).window;
    if (!node?.addEventListener || !win) return;
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    node.style.cursor = 'grab';

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.pageX;
      startLeft = node.scrollLeft;
    };
    const onMove = (e: MouseEvent) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        node.style.cursor = 'grabbing';
        node.style.userSelect = 'none';
      }
      if (moved) {
        node.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      node.style.cursor = 'grab';
      node.style.userSelect = '';
    };
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      moved = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const onDragStart = (e: Event) => e.preventDefault();

    node.addEventListener('mousedown', onDown);
    node.addEventListener('click', onClick, true);
    node.addEventListener('dragstart', onDragStart);
    win.addEventListener('mousemove', onMove);
    win.addEventListener('mouseup', onUp);
    return () => {
      node.removeEventListener('mousedown', onDown);
      node.removeEventListener('click', onClick, true);
      node.removeEventListener('dragstart', onDragStart);
      win.removeEventListener('mousemove', onMove);
      win.removeEventListener('mouseup', onUp);
    };
  }, []);

  return <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={style}
    contentContainerStyle={contentContainerStyle}>
    {children}
  </ScrollView>;
}
