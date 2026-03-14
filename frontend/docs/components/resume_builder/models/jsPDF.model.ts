export interface Standard {
  ORIENTATION: Orientation | undefined;
  UNIT: Unit;
  FORMAT: string;
  MARGIN: number;
  FONT_NAME: string;
  HEADER_FONT_SIZE: number;
  SECTION_FONT_SIZE: number;
  TEXT_FONT_SIZE: number;
}

export interface FormatParameters {
  NAME: string;
  PORTRAIT_WIDTH: number;
  PORTRAIT_HEIGHT: number;
}

type Orientation = "p" | "portrait" | "landscape";

type Unit = "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc";
