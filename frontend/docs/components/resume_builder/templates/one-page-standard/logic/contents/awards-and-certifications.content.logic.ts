import jsPDF from "jspdf";
import { FormatParameters, Standard, AwardsAndCertification } from "../../../../models";
import { Cursor } from "../../../../class";
import {
  enterAndCheckMargin,
  FontStyle,
  splitTextToSize,
  updateFontAndSize,
  writeLeft,
  writeRight,
} from "../../../../utils";
import {
  BULLETS,
  BULLETS_WIDTH,
  DEFAULT_LINE_HEIGHT,
  AWARDS_AND_CERTS_DATE_WIDTH,
} from "../../constants/one-page-standard.constants";
import { trimEnd, upperFirst } from "lodash";

export function constructAwardsAndCertificationsContent(
  awardsAndCertifications: AwardsAndCertification[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.TEXT_FONT_SIZE);
  awardsAndCertifications.forEach((awardOrCert, index) => {
    updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.REGULAR, cursor.getSize());
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, BULLETS, cursor);
    cursor.setXCoordinate(standard.MARGIN + BULLETS_WIDTH);
    const awardOrCertTexts: string[] = splitTextToSize(
      jsPDFInstance,
      trimEnd(upperFirst(awardOrCert.name), "."),
      pageParameters.PORTRAIT_WIDTH -
        2 * standard.MARGIN -
        BULLETS_WIDTH -
        AWARDS_AND_CERTS_DATE_WIDTH,
    );
    writeLeft(jsPDFInstance, awardOrCertTexts, cursor);
    updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.BOLD, cursor.getSize());
    cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH - standard.MARGIN);
    writeRight(jsPDFInstance, awardOrCert.acquiredDate, cursor);
    if (index < awardsAndCertifications.length - 1) {
      enterAndCheckMargin(
        jsPDFInstance,
        cursor,
        standard,
        pageParameters,
        DEFAULT_LINE_HEIGHT,
        awardOrCertTexts.length,
      );
    }
  });
}
