import React from "react";
import { Check, Shirt } from "lucide-react";
import { Client, UniformKitType } from "../types";

export interface UniformState {
  hasUniform: boolean;
  uniformKits: UniformKitType[];
}

export const UNIFORM_KIT_META: Record<
  UniformKitType,
  {
    id: UniformKitType;
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  red_black: {
    id: "red_black",
    label: "Красно-чёрная",
    shortLabel: "К-Ч",
    description: "Основная игровая форма",
  },
  white: {
    id: "white",
    label: "Белая",
    shortLabel: "Белая",
    description: "Выездная / светлая форма",
  },
};

export const UNIFORM_KIT_ORDER: UniformKitType[] = ["red_black", "white"];

export function normalizeUniformState(
  hasUniform?: boolean,
  uniformKits?: UniformKitType[],
): UniformState {
  const validKits = Array.isArray(uniformKits)
    ? UNIFORM_KIT_ORDER.filter((k) => uniformKits.includes(k))
    : [];
  const normalizedHas = Boolean(hasUniform) || validKits.length > 0;
  return {
    hasUniform: normalizedHas,
    uniformKits: validKits,
  };
}

export function formatUniformSummary(
  client: Pick<Client, "hasUniform" | "uniformKits">,
): string {
  const { hasUniform, uniformKits } = normalizeUniformState(
    client.hasUniform,
    client.uniformKits,
  );
  if (!hasUniform) return "Нет формы";
  if (uniformKits.length === 2) return "Красно-чёрная и белая";
  if (uniformKits[0] === "red_black") return "Красно-чёрная";
  if (uniformKits[0] === "white") return "Белая";
  return "Есть (вид не указан)";
}

export type UniformFilterValue =
  | "all"
  | "has_any"
  | "red_black"
  | "white"
  | "both"
  | "none";

export function matchesUniformFilter(
  client: Pick<Client, "hasUniform" | "uniformKits">,
  filter: UniformFilterValue | string,
): boolean {
  if (!filter || filter === "all") return true;
  const { hasUniform, uniformKits } = normalizeUniformState(
    client.hasUniform,
    client.uniformKits,
  );
  switch (filter) {
    case "has_any":
      return hasUniform;
    case "red_black":
      return uniformKits.includes("red_black");
    case "white":
      return uniformKits.includes("white");
    case "both":
      return uniformKits.includes("red_black") && uniformKits.includes("white");
    case "none":
      return !hasUniform;
    default:
      return true;
  }
}

export const UniformKitSwatch: React.FC<{
  kit: UniformKitType;
  size?: "sm" | "md";
}> = ({ kit, size = "sm" }) => {
  const dims = size === "md" ? "w-4 h-4" : "w-3 h-3";
  if (kit === "red_black") {
    return (
      <span
        aria-hidden="true"
        className={`${dims} rounded-[3px] inline-flex overflow-hidden border border-slate-900/30 shrink-0`}
      >
        <span className="w-1/2 h-full bg-red-600" />
        <span className="w-1/2 h-full bg-slate-950" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${dims} rounded-[3px] inline-block bg-white border border-slate-300 shrink-0`}
    />
  );
};

interface UniformKitControlProps {
  hasUniform?: boolean;
  uniformKits?: UniformKitType[];
  onChange?: (next: UniformState) => void;
  variant?: "compact" | "form" | "readonly";
  disabled?: boolean;
  uniformSize?: string;
}

export const UniformKitControl: React.FC<UniformKitControlProps> = ({
  hasUniform,
  uniformKits,
  onChange,
  variant = "compact",
  disabled = false,
  uniformSize,
}) => {
  const state = normalizeUniformState(hasUniform, uniformKits);

  const handleToggleHasUniform = (checked: boolean) => {
    if (!onChange || disabled) return;
    if (!checked) {
      onChange({ hasUniform: false, uniformKits: [] });
    } else {
      onChange({ hasUniform: true, uniformKits: state.uniformKits });
    }
  };

  const handleToggleKit = (kit: UniformKitType) => {
    if (!onChange || disabled) return;
    const exists = state.uniformKits.includes(kit);
    const nextKits = exists
      ? state.uniformKits.filter((k) => k !== kit)
      : UNIFORM_KIT_ORDER.filter(
          (k) => k === kit || state.uniformKits.includes(k),
        );
    onChange({
      hasUniform: nextKits.length > 0,
      uniformKits: nextKits,
    });
  };

  if (variant === "readonly") {
    return (
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
        <span
          className={`font-semibold ${
            state.hasUniform ? "text-emerald-700" : "text-slate-500"
          }`}
        >
          {state.hasUniform ? "Форма есть" : "Форма не отмечена"}
        </span>
        {state.uniformKits.length > 0 && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
              {state.uniformKits.map((kit) => (
                <span key={kit} className="inline-flex items-center gap-1">
                  <UniformKitSwatch kit={kit} size="sm" />
                  <span>{UNIFORM_KIT_META[kit].label}</span>
                </span>
              ))}
            </span>
          </>
        )}
        {uniformSize && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 tabular-nums">
              Размер: {uniformSize}
            </span>
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className="flex flex-col gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={state.hasUniform}
            disabled={disabled}
            onChange={(e) => handleToggleHasUniform(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
          />
          <span
            className={`text-[11px] font-semibold whitespace-nowrap ${
              state.hasUniform ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {state.hasUniform
              ? state.uniformKits.length === 0
                ? "Есть (вид?)"
                : "Есть"
              : "Нет"}
          </span>
        </label>

        <div className="flex items-center gap-1">
          {UNIFORM_KIT_ORDER.map((kit) => {
            const active = state.uniformKits.includes(kit);
            const meta = UNIFORM_KIT_META[kit];
            return (
              <button
                key={kit}
                type="button"
                disabled={disabled}
                onClick={() => handleToggleKit(kit)}
                title={`${meta.label} форма (${active ? "есть — нажмите, чтобы убрать" : "нажмите, чтобы отметить"})`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? kit === "red_black"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-900 border-slate-900 shadow-2xs"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                }`}
              >
                <UniformKitSwatch kit={kit} size="sm" />
                <span>{meta.shortLabel}</span>
                {active && <Check className="w-2.5 h-2.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Form / Card variant
  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.hasUniform}
            disabled={disabled}
            onChange={(e) => handleToggleHasUniform(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-slate-500" />
            <span>Форма есть у игрока</span>
          </span>
        </label>

        <span
          className={`text-[11px] font-semibold ${
            state.hasUniform ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          {formatUniformSummary(state)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {UNIFORM_KIT_ORDER.map((kit) => {
          const active = state.uniformKits.includes(kit);
          const meta = UNIFORM_KIT_META[kit];
          return (
            <button
              key={kit}
              type="button"
              disabled={disabled}
              onClick={() => handleToggleKit(kit)}
              className={`px-3 py-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                active
                  ? kit === "red_black"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-950 border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <UniformKitSwatch kit={kit} size="md" />
                <span className="text-xs font-semibold truncate">
                  {meta.label}
                </span>
              </span>
              <span
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  active
                    ? kit === "red_black"
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                {active && <Check className="w-3 h-3" />}
              </span>
            </button>
          );
        })}
      </div>

      {state.hasUniform && state.uniformKits.length === 0 && (
        <p className="text-[11px] text-amber-700 font-medium">
          Отметьте выше, какая именно форма есть у игрока (красно-чёрная, белая
          или обе).
        </p>
      )}
    </div>
  );
};
