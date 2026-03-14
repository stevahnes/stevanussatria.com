import jsPDF from "jspdf";
import { FormatParameters, Standard } from "../../../../models";
import { Cursor } from "../../../../class";
import {
  enterAndCheckMargin,
  FontStyle,
  splitTextToSize,
  updateFontAndSize,
  writeLeft,
} from "../../../../utils";
import { DEFAULT_LINE_HEIGHT } from "../../constants/one-page-standard.constants";

export function constructProfileContent(
  profile: string,
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.TEXT_FONT_SIZE);
  updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.REGULAR, cursor.getSize());
  const profileTexts: string[] = splitTextToSize(
    jsPDFInstance,
    profile,
    pageParameters.PORTRAIT_WIDTH - 2 * standard.MARGIN,
  );
  cursor.setXCoordinate(standard.MARGIN);
  writeLeft(jsPDFInstance, profileTexts, cursor);
  enterAndCheckMargin(
    jsPDFInstance,
    cursor,
    standard,
    pageParameters,
    DEFAULT_LINE_HEIGHT,
    profileTexts.length,
  );
}
