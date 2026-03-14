import jsPDF from "jspdf";
import { FormatParameters, Standard } from "../models";
import { Cursor } from "../class";
import { POINT_TO_MM } from "../constants";

export enum FontStyle {
  BOLD = "bold",
  ITALIC = "italic",
  REGULAR = "normal",
}

export function splitTextToSize(jsPDFInstance: jsPDF, text: string, maxWidth: number): string[] {
  return jsPDFInstance.splitTextToSize(text, maxWidth) as string[];
}

export function writeCenter(jsPDFInstance: jsPDF, text: string | string[], cursor: Cursor): void {
  jsPDFInstance.text(text, cursor.getXCoordinate(), cursor.getYCoordinate(), {
    align: "center",
  });
}

export function writeLeft(jsPDFInstance: jsPDF, text: string | string[], cursor: Cursor): void {
  jsPDFInstance.text(text, cursor.getXCoordinate(), cursor.getYCoordinate(), {
    align: "left",
  });
}

export function writeRight(jsPDFInstance: jsPDF, text: string | string[], cursor: Cursor): void {
  jsPDFInstance.text(text, cursor.getXCoordinate(), cursor.getYCoordinate(), {
    align: "right",
  });
}

export function updateFontAndSize(
  jsPDFInstance: jsPDF,
  fontName: string,
  fontStyle: FontStyle,
  fontSize: number,
): void {
  jsPDFInstance.setFont(fontName, fontStyle);
  jsPDFInstance.setFontSize(fontSize);
}

export function drawPageWidthLine(
  jsPDFInstance: jsPDF,
  standard: Standard,
  pageParameters: FormatParameters,
  yCoordinate: number,
  lineWidth: number,
): void {
  jsPDFInstance.setLineWidth(lineWidth);
  if (standard.ORIENTATION === "landscape") {
    jsPDFInstance.line(
      standard.MARGIN,
      yCoordinate,
      pageParameters.PORTRAIT_HEIGHT - standard.MARGIN,
      yCoordinate,
    );
  } else {
    jsPDFInstance.line(
      standard.MARGIN,
      yCoordinate,
      pageParameters.PORTRAIT_WIDTH - standard.MARGIN,
      yCoordinate,
    );
  }
}

export function enterAndCheckMargin(
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
  lineHeight: number,
  times: number,
): void {
  cursor.incrementYCoordinate(times * (lineHeight * (cursor.getSize() * POINT_TO_MM)));
  if (
    standard.ORIENTATION === "landscape" &&
    cursor.getYCoordinate() >= pageParameters.PORTRAIT_WIDTH - standard.MARGIN
  ) {
    jsPDFInstance.addPage(pageParameters.NAME, standard.ORIENTATION);
    cursor.setYCoordinate(standard.MARGIN);
  } else if (
    standard.ORIENTATION === "portrait" &&
    cursor.getYCoordinate() >= pageParameters.PORTRAIT_HEIGHT - standard.MARGIN
  ) {
    jsPDFInstance.addPage(pageParameters.NAME, standard.ORIENTATION);
    cursor.setYCoordinate(standard.MARGIN);
  }
}

export function addLineSpace(
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
  lineHeight: number,
): void {
  return enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, lineHeight, 1);
}
