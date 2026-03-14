import jsPDF from "jspdf";
import { FormatParameters, Standard } from "../../../../models";
import { Cursor } from "../../../../class";
import {
  drawPageWidthLine,
  enterAndCheckMargin,
  FontStyle,
  updateFontAndSize,
  writeLeft,
} from "../../../../utils";
import {
  DEFAULT_LINE_HEIGHT,
  SECTION_LINE_WIDTH,
} from "../../constants/one-page-standard.constants";

export function constructSectionHeader(
  sectionHeaderText: string,
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.SECTION_FONT_SIZE);
  updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.BOLD, cursor.getSize());
  cursor.setXCoordinate(standard.MARGIN);
  writeLeft(jsPDFInstance, sectionHeaderText, cursor);
  const sectionLine = cursor.getYCoordinate() + ((DEFAULT_LINE_HEIGHT - 1) * cursor.getSize()) / 2;
  drawPageWidthLine(jsPDFInstance, standard, pageParameters, sectionLine, SECTION_LINE_WIDTH);
  enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
}
