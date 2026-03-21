"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@visx/text";
import type { GraphAnnotation } from "@/lib/graph/saved-graph-types";
import type { ViewTransform } from "./types";

interface GraphAnnotationsProps {
  annotations: GraphAnnotation[];
  annotateMode: boolean;
  viewTransform?: ViewTransform;
  onAdd: (annotation: GraphAnnotation) => void;
  onUpdate: (id: string, patch: Partial<GraphAnnotation>) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_NOTE_W = 180;
const DEFAULT_NOTE_H = 100;
const NOTE_PAD = 8;
const DRAG_THRESHOLD = 5;
const RESIZE_HANDLE = 10;

export function GraphAnnotations({
  annotations,
  annotateMode,
  viewTransform,
  onAdd,
  onUpdate,
  onDelete,
}: GraphAnnotationsProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const editingIdRef = useRef<string | null>(null);
  const editTitleRef = useRef("");
  const editBodyRef = useRef("");

  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editBodyRef.current = editBody; }, [editBody]);

  const dragRef = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [drawState, setDrawState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isCircle: boolean;
  } | null>(null);

  const toGraph = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!viewTransform) return { x: clientX, y: clientY };
    return {
      x: (clientX - viewTransform.x) / viewTransform.scale,
      y: (clientY - viewTransform.y) / viewTransform.scale,
    };
  }, [viewTransform]);

  // ─── Commit any active edit ───────────────────────────────────

  const flushEdit = useCallback(() => {
    const id = editingIdRef.current;
    if (id) {
      onUpdate(id, { title: editTitleRef.current.slice(0, 20), body: editBodyRef.current.slice(0, 5000) });
      setEditingId(null);
      editingIdRef.current = null;
    }
  }, [onUpdate]);

  // ─── Canvas click/drag to create annotations ─────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!annotateMode) return;
    if ((e.target as SVGElement).closest("[data-annotation]")) return;
    e.stopPropagation();
    // Commit any active text edit before starting a new action
    flushEdit();
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    const pos = toGraph(e.clientX - svgRect.left, e.clientY - svgRect.top);
    setDrawState({
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      isCircle: e.shiftKey,
    });
    setSelectedId(null);
  }, [annotateMode, toGraph, flushEdit]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!drawState) return;
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    const pos = toGraph(e.clientX - svgRect.left, e.clientY - svgRect.top);
    setDrawState((prev) => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
  }, [drawState, toGraph]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!drawState) return;
    const dx = drawState.currentX - drawState.startX;
    const dy = drawState.currentY - drawState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Click - place a note
      const id = crypto.randomUUID();
      onAdd({
        id,
        type: "note",
        x: drawState.startX - DEFAULT_NOTE_W / 2,
        y: drawState.startY - DEFAULT_NOTE_H / 2,
        title: "",
        body: "",
        width: DEFAULT_NOTE_W,
        height: DEFAULT_NOTE_H,
      });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    } else if (drawState.isCircle) {
      const cx = (drawState.startX + drawState.currentX) / 2;
      const cy = (drawState.startY + drawState.currentY) / 2;
      const radius = dist / 2;
      const id = crypto.randomUUID();
      onAdd({ id, type: "circle", x: cx, y: cy, title: "", body: "", radius });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    } else {
      const x = Math.min(drawState.startX, drawState.currentX);
      const y = Math.min(drawState.startY, drawState.currentY);
      const w = Math.abs(dx);
      const h = Math.abs(dy);
      const id = crypto.randomUUID();
      onAdd({ id, type: "rect", x, y, title: "", body: "", width: w, height: h });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    }
    setDrawState(null);
  }, [drawState, onAdd]);

  // ─── Annotation drag ─────────────────────────────────────────

  const handleAnnotationMouseDown = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    if (!annotateMode) return;
    e.stopPropagation();
    setSelectedId(a.id);
    if (editingIdRef.current && editingIdRef.current !== a.id) flushEdit();

    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    dragRef.current = {
      id: a.id,
      startMouseX: e.clientX - svgRect.left,
      startMouseY: e.clientY - svgRect.top,
      startX: a.x,
      startY: a.y,
      isDragging: false,
    };

    const handleMove = (me: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const mx = me.clientX - svgRect.left;
      const my = me.clientY - svgRect.top;
      const dp = toGraph(mx, my);
      const sp = toGraph(drag.startMouseX, drag.startMouseY);
      const ddx = dp.x - sp.x;
      const ddy = dp.y - sp.y;
      if (!drag.isDragging && Math.sqrt(ddx * ddx + ddy * ddy) < DRAG_THRESHOLD) return;
      drag.isDragging = true;
      onUpdate(drag.id, { x: drag.startX + ddx, y: drag.startY + ddy });
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [annotateMode, toGraph, onUpdate, flushEdit]);

  // ─── Resize handle ────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    e.stopPropagation();
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    resizeRef.current = {
      id: a.id,
      startMouseX: e.clientX - svgRect.left,
      startMouseY: e.clientY - svgRect.top,
      startW: a.width ?? DEFAULT_NOTE_W,
      startH: a.height ?? DEFAULT_NOTE_H,
    };

    const handleMove = (me: MouseEvent) => {
      const rs = resizeRef.current;
      if (!rs) return;
      const mx = me.clientX - svgRect.left;
      const my = me.clientY - svgRect.top;
      const dp = toGraph(mx, my);
      const sp = toGraph(rs.startMouseX, rs.startMouseY);
      const newW = Math.max(80, rs.startW + (dp.x - sp.x));
      const newH = Math.max(40, rs.startH + (dp.y - sp.y));
      onUpdate(rs.id, { width: newW, height: newH });
    };

    const handleUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [toGraph, onUpdate]);

  // ─── Double-click to edit ─────────────────────────────────────

  const handleAnnotationDoubleClick = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    if (!annotateMode) return;
    e.stopPropagation();
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setSelectedId(a.id);
  }, [annotateMode]);

  // ─── Render helpers ───────────────────────────────────────────

  const renderDeleteBtn = (cx: number, cy: number, id: string) => (
    <g style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onDelete(id); setSelectedId(null); }}>
      <circle cx={cx} cy={cy} r={8} fill="#ef4444" />
      <Text x={cx} y={cy + 4} fontSize={10} fontWeight={700} textAnchor="middle" fill="white">x</Text>
    </g>
  );

  const renderResizeHandle = (x: number, y: number, a: GraphAnnotation) => (
    <rect
      x={x - RESIZE_HANDLE / 2}
      y={y - RESIZE_HANDLE / 2}
      width={RESIZE_HANDLE}
      height={RESIZE_HANDLE}
      rx={2}
      fill="#f59e0b"
      fillOpacity={0.6}
      style={{ cursor: "nwse-resize" }}
      onMouseDown={(e) => handleResizeMouseDown(e, a)}
    />
  );

  const renderNoteEditor = (x: number, y: number, w: number, h: number, color: string) => (
    <foreignObject x={x} y={y} width={w} height={h}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "3px" }}>
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value.slice(0, 20))}
          onKeyDown={(e) => { if (e.key === "Escape") flushEdit(); }}
          placeholder={t("graph.annotation.titlePlaceholder", { defaultValue: "Title (max 20)" })}
          style={{
            width: "100%", background: "transparent", color,
            border: "none", borderBottom: `1px solid ${color}33`, outline: "none",
            fontSize: "11px", fontWeight: 600, fontFamily: "inherit", padding: "1px 0",
          }}
        />
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value.slice(0, 5000))}
          onBlur={flushEdit}
          onKeyDown={(e) => { if (e.key === "Escape") flushEdit(); }}
          placeholder={t("graph.annotation.bodyPlaceholder", { defaultValue: "Notes (saved to workspace)..." })}
          style={{
            flex: 1, width: "100%", background: "transparent", color,
            border: "none", outline: "none", resize: "none",
            fontSize: "10px", fontFamily: "inherit", lineHeight: "1.4",
            padding: "2px 0", opacity: 0.8,
          }}
        />
      </div>
    </foreignObject>
  );

  const renderShapeEditor = (x: number, y: number, w: number, color: string) => (
    <foreignObject x={x} y={y} width={w} height={20}>
      <input
        autoFocus
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value.slice(0, 20))}
        onBlur={flushEdit}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") flushEdit(); }}
        placeholder={t("graph.annotation.labelPlaceholder", { defaultValue: "Label (max 20)" })}
        style={{
          width: "100%", height: "18px", background: "transparent", color,
          border: "none", outline: "none",
          fontSize: "11px", fontWeight: 600, fontFamily: "inherit", padding: "0 2px",
        }}
      />
    </foreignObject>
  );

  return (
    <g
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      style={{ pointerEvents: annotateMode ? "all" : "none", cursor: annotateMode ? "crosshair" : "default" }}
    >
      {/* Hit area for canvas clicks in annotate mode */}
      {annotateMode && (
        <rect x={-10000} y={-10000} width={30000} height={30000} fill="transparent" pointerEvents="all" style={{ cursor: "crosshair" }} />
      )}

      {/* Drawing preview */}
      {drawState && (() => {
        const dx = drawState.currentX - drawState.startX;
        const dy = drawState.currentY - drawState.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) return null;
        if (drawState.isCircle) {
          const cx = (drawState.startX + drawState.currentX) / 2;
          const cy = (drawState.startY + drawState.currentY) / 2;
          return (
            <circle cx={cx} cy={cy} r={dist / 2}
              fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" />
          );
        }
        const x = Math.min(drawState.startX, drawState.currentX);
        const y = Math.min(drawState.startY, drawState.currentY);
        return (
          <rect x={x} y={y} width={Math.abs(dx)} height={Math.abs(dy)} rx={4}
            fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" />
        );
      })()}

      {/* Rendered annotations */}
      {annotations.map((a) => {
        const isSelected = selectedId === a.id && annotateMode;
        const isEditing = editingId === a.id;
        const borderColor = isSelected ? "#f59e0b" : (a.color || "rgba(255,255,255,0.2)");

        if (a.type === "note") {
          const w = a.width ?? DEFAULT_NOTE_W;
          const h = a.height ?? DEFAULT_NOTE_H;
          return (
            <g key={a.id} data-annotation={a.id}
              onMouseDown={(e) => handleAnnotationMouseDown(e, a)}
              onDoubleClick={(e) => handleAnnotationDoubleClick(e, a)}
              style={{ pointerEvents: annotateMode ? "all" : "none", cursor: annotateMode ? "move" : "default" }}
            >
              <rect x={a.x} y={a.y} width={w} height={h} rx={6}
                fill="rgba(30, 30, 30, 0.85)" stroke={borderColor} strokeWidth={isSelected ? 1.5 : 1} />
              {isEditing ? (
                renderNoteEditor(a.x + NOTE_PAD, a.y + NOTE_PAD, w - NOTE_PAD * 2, h - NOTE_PAD * 2, "#e5e5e5")
              ) : (
                <>
                  <Text x={a.x + NOTE_PAD} y={a.y + NOTE_PAD + 13} fontSize={11} fontWeight={600} fill="#e5e5e5" width={w - NOTE_PAD * 2}>
                    {a.title || (annotateMode ? t("graph.annotation.doubleClickToEdit", { defaultValue: "Double-click to edit" }) : "")}
                  </Text>
                  {a.body && (
                    <Text x={a.x + NOTE_PAD} y={a.y + NOTE_PAD + 28} fontSize={10} fill="#e5e5e5" fillOpacity={0.6} width={w - NOTE_PAD * 2}>
                      {a.body.length > 80 ? a.body.slice(0, 80) + "..." : a.body}
                    </Text>
                  )}
                </>
              )}
              {isSelected && renderDeleteBtn(a.x + w - 4, a.y - 4, a.id)}
              {isSelected && renderResizeHandle(a.x + w, a.y + h, a)}
            </g>
          );
        }

        if (a.type === "rect") {
          const w = a.width ?? 120;
          const h = a.height ?? 80;
          return (
            <g key={a.id} data-annotation={a.id}
              onMouseDown={(e) => handleAnnotationMouseDown(e, a)}
              onDoubleClick={(e) => handleAnnotationDoubleClick(e, a)}
              style={{ pointerEvents: annotateMode ? "all" : "none", cursor: annotateMode ? "move" : "default" }}
            >
              <rect x={a.x} y={a.y} width={w} height={h} rx={4}
                fill="rgba(245, 158, 11, 0.06)" stroke={borderColor} strokeWidth={isSelected ? 1.5 : 1} strokeDasharray="6 4" />
              {isEditing ? (
                renderShapeEditor(a.x + NOTE_PAD, a.y + h / 2 - 10, w - NOTE_PAD * 2, "#f59e0b")
              ) : a.title ? (
                <Text x={a.x + w / 2} y={a.y + h / 2 + 4} fontSize={11} fontWeight={600} fill="#f59e0b" textAnchor="middle" width={w - NOTE_PAD * 2}>{a.title}</Text>
              ) : null}
              {isSelected && renderDeleteBtn(a.x + w - 4, a.y - 4, a.id)}
              {isSelected && renderResizeHandle(a.x + w, a.y + h, a)}
            </g>
          );
        }

        if (a.type === "circle") {
          const r = a.radius ?? 50;
          return (
            <g key={a.id} data-annotation={a.id}
              onMouseDown={(e) => handleAnnotationMouseDown(e, a)}
              onDoubleClick={(e) => handleAnnotationDoubleClick(e, a)}
              style={{ pointerEvents: annotateMode ? "all" : "none", cursor: annotateMode ? "move" : "default" }}
            >
              <circle cx={a.x} cy={a.y} r={r}
                fill="rgba(245, 158, 11, 0.06)" stroke={borderColor} strokeWidth={isSelected ? 1.5 : 1} strokeDasharray="6 4" />
              {isEditing ? (
                renderShapeEditor(a.x - r * 0.6, a.y - 10, r * 1.2, "#f59e0b")
              ) : a.title ? (
                <Text x={a.x} y={a.y + 4} fontSize={11} fontWeight={600} fill="#f59e0b" textAnchor="middle" width={r * 1.4}>{a.title}</Text>
              ) : null}
              {isSelected && renderDeleteBtn(a.x + r * 0.7, a.y - r * 0.7, a.id)}
            </g>
          );
        }

        return null;
      })}
    </g>
  );
}
