"use client";

import { useRef, useState } from "react";

const DELETE_WIDTH = 88;
const DRAG_THRESHOLD = 6;

export default function SwipeableRow({
  children,
  onDelete,
  onClick,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  onClick: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const baseX = useRef(0);
  const dragging = useRef(false);
  const wasDragged = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    wasDragged.current = false;
    startX.current = e.clientX;
    baseX.current = dragX;
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) wasDragged.current = true;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, baseX.current + delta));
    setDragX(next);
  }

  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setDragX(dragX < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0);
  }

  function handleClick() {
    if (wasDragged.current) return;
    if (dragX !== 0) {
      setDragX(0);
      return;
    }
    onClick();
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        onClick={() => {
          setDragX(0);
          onDelete();
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white text-sm font-medium"
        style={{ width: DELETE_WIDTH }}
      >
        Eliminar
      </button>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        className="relative bg-white touch-pan-y cursor-pointer"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
