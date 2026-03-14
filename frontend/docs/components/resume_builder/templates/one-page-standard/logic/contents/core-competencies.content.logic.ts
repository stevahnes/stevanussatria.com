import jsPDF from "jspdf";
import { FormatParameters, Standard } from "../../../../models";
import { Cursor } from "../../../../class";
import {
  enterAndCheckMargin,
  FontStyle,
  splitTextToSize,
  updateFontAndSize,
  writeCenter,
} from "../../../../utils";
import { DEFAULT_LINE_HEIGHT } from "../../constants/one-page-standard.constants";
import { trimEnd, trimStart } from "lodash";

export function constructCoreCompetenciesContent(
  competencies: string[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.TEXT_FONT_SIZE);
  updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.REGULAR, cursor.getSize());
  const competenciesTexts: string[] = splitTextToSize(
    jsPDFInstance,
    competencies.join(" • "),
    pageParameters.PORTRAIT_WIDTH - 2 * standard.MARGIN,
  ).map(text => trimStart(trimEnd(text, " •"), "• "));
  cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH / 2);
  writeCenter(jsPDFInstance, competenciesTexts, cursor);
  enterAndCheckMargin(
    jsPDFInstance,
    cursor,
    standard,
    pageParameters,
    DEFAULT_LINE_HEIGHT,
    competenciesTexts.length,
  );
}
