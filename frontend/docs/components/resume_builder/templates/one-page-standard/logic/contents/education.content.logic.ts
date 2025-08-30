import jsPDF from "jspdf";
import { FormatParameters, Standard, Education } from "../../../../models";
import { Cursor } from "../../../../class";
import {
  enterAndCheckMargin,
  FontStyle,
  updateFontAndSize,
  writeLeft,
  writeRight,
} from "../../../../utils";
import {
  DEFAULT_LINE_HEIGHT,
  UNDEFINED_PERIOD_END,
} from "../../constants/one-page-standard.constants";
import { startCase, toUpper } from "lodash";

export function constructEducationContent(
  educations: Education[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.TEXT_FONT_SIZE);
  educations.forEach((education, index) => {
    updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.BOLD, cursor.getSize());
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, toUpper(education.institution), cursor);
    cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH - standard.MARGIN);
    const educationPeriodText = `${startCase(education.start)} – ${startCase(
      education.end.length > 0 ? education.end : UNDEFINED_PERIOD_END,
    )}`;
    writeRight(jsPDFInstance, educationPeriodText, cursor);
    enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, education.qualification, cursor);
    if (education.honorsAndGrade) {
      updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.REGULAR, cursor.getSize());
      cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH - standard.MARGIN);
      writeRight(jsPDFInstance, education.honorsAndGrade, cursor);
    }
    enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
    if (index < educations.length - 1) {
      enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
    }
  });
}
