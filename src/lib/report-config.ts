export type ReportDisplayConfigPayload = {
  showExecutiveSummary: boolean;
  showRadar: boolean;
  showCategorization: boolean;
  showPrioritization: boolean;
  showActionPlan: boolean;
  showScaleLegend: boolean;
  logoUrl: string | null;
  // Nuevo nombres para UI: afectan solo al PDF
  titleColor: string; // color para títulos
  textColor: string; // color para texto
  headerTitle: string;
  headerSubtitle: string | null;
};

export const DEFAULT_REPORT_DISPLAY_CONFIG: ReportDisplayConfigPayload = {
  showExecutiveSummary: true,
  showRadar: true,
  showCategorization: true,
  showPrioritization: true,
  showActionPlan: true,
  showScaleLegend: false,
  // Por defecto usar la imagen pública logoudea.png (colócala en /public/logoudea.png)
  logoUrl: "/logoudea.png",
  titleColor: "#2E6347",
  textColor: "#0F0F0F",
  headerTitle: "Reporte de Evaluación Digital",
  headerSubtitle: "Resultados consolidados del diagnóstico",
};

export function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(value);
}

export function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

// Normaliza la entrada y devuelve la forma adecuada para guardar en la BD
// (columns DB: primaryColor, secondaryColor). Acepta tanto los nombres
// antiguos (`primaryColor`/`secondaryColor`) como los nuevos (`titleColor`/`textColor`).
export function normalizeReportDisplayConfigInput(input: Record<string, unknown>) {
  const logoUrl = normalizeOptionalText(input.logoUrl, 500);
  const headerTitle = normalizeOptionalText(input.headerTitle, 120) ?? DEFAULT_REPORT_DISPLAY_CONFIG.headerTitle;
  const headerSubtitle = normalizeOptionalText(input.headerSubtitle, 160);

  // prefer new UI names, fallback to old DB names
  const titleColorRaw = (typeof input.titleColor === "string" && input.titleColor) || input.primaryColor || DEFAULT_REPORT_DISPLAY_CONFIG.titleColor;
  const textColorRaw = (typeof input.textColor === "string" && input.textColor) || input.secondaryColor || DEFAULT_REPORT_DISPLAY_CONFIG.textColor;

  const primaryColor = typeof titleColorRaw === "string" && isHexColor(titleColorRaw.trim()) ? titleColorRaw.trim() : DEFAULT_REPORT_DISPLAY_CONFIG.titleColor;
  const secondaryColor = typeof textColorRaw === "string" && isHexColor(textColorRaw.trim()) ? textColorRaw.trim() : DEFAULT_REPORT_DISPLAY_CONFIG.textColor;

  return {
    showExecutiveSummary: Boolean(input.showExecutiveSummary ?? DEFAULT_REPORT_DISPLAY_CONFIG.showExecutiveSummary),
    showRadar: Boolean(input.showRadar ?? DEFAULT_REPORT_DISPLAY_CONFIG.showRadar),
    showCategorization: Boolean(input.showCategorization ?? DEFAULT_REPORT_DISPLAY_CONFIG.showCategorization),
    showPrioritization: Boolean(input.showPrioritization ?? DEFAULT_REPORT_DISPLAY_CONFIG.showPrioritization),
    showActionPlan: Boolean(input.showActionPlan ?? DEFAULT_REPORT_DISPLAY_CONFIG.showActionPlan),
    showScaleLegend: Boolean(input.showScaleLegend ?? DEFAULT_REPORT_DISPLAY_CONFIG.showScaleLegend),
    // DB fields
    logoUrl,
    primaryColor,
    secondaryColor,
    headerTitle,
    headerSubtitle,
  };
}

// Convierte la configuración proveniente de la BD (que contiene primaryColor/secondaryColor)
// a la forma usada por la UI/PDF (`titleColor`/`textColor`). También acepta ya la forma UI.
export function withDefaultReportConfig<T extends Partial<Record<string, unknown>> | null | undefined>(config: T): ReportDisplayConfigPayload {
  if (!config) return { ...DEFAULT_REPORT_DISPLAY_CONFIG };

  // extraer colores del shape DB o UI
  const primaryColor = (config as any).primaryColor as string | undefined;
  const secondaryColor = (config as any).secondaryColor as string | undefined;
  const titleColor = (config as any).titleColor as string | undefined;
  const textColor = (config as any).textColor as string | undefined;

  return {
    ...DEFAULT_REPORT_DISPLAY_CONFIG,
    showExecutiveSummary: Boolean((config as any).showExecutiveSummary ?? DEFAULT_REPORT_DISPLAY_CONFIG.showExecutiveSummary),
    showRadar: Boolean((config as any).showRadar ?? DEFAULT_REPORT_DISPLAY_CONFIG.showRadar),
    showCategorization: Boolean((config as any).showCategorization ?? DEFAULT_REPORT_DISPLAY_CONFIG.showCategorization),
    showPrioritization: Boolean((config as any).showPrioritization ?? DEFAULT_REPORT_DISPLAY_CONFIG.showPrioritization),
    showActionPlan: Boolean((config as any).showActionPlan ?? DEFAULT_REPORT_DISPLAY_CONFIG.showActionPlan),
    showScaleLegend: Boolean((config as any).showScaleLegend ?? DEFAULT_REPORT_DISPLAY_CONFIG.showScaleLegend),
    logoUrl: (config as any).logoUrl ?? DEFAULT_REPORT_DISPLAY_CONFIG.logoUrl,
    titleColor: titleColor ?? primaryColor ?? DEFAULT_REPORT_DISPLAY_CONFIG.titleColor,
    textColor: textColor ?? secondaryColor ?? DEFAULT_REPORT_DISPLAY_CONFIG.textColor,
    headerTitle: (config as any).headerTitle ?? DEFAULT_REPORT_DISPLAY_CONFIG.headerTitle,
    headerSubtitle: (config as any).headerSubtitle ?? DEFAULT_REPORT_DISPLAY_CONFIG.headerSubtitle,
  };
}
