import jsPDF from "jspdf";
import { Designation, FormatParameters, Standard, Work } from "../../../../models";
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
  UNDEFINED_PERIOD_END,
} from "../../constants/one-page-standard.constants";
import { startCase, toUpper, trimEnd, upperFirst } from "lodash";

export function constructWorkExperienceContent(
  works: Work[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  cursor.setSize(standard.TEXT_FONT_SIZE);
  works.forEach((work, index) => {
    updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.BOLD, cursor.getSize());
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, toUpper(work.company), cursor);
    cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH - standard.MARGIN);
    writeRight(jsPDFInstance, startCase(work.location), cursor);
    enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
    constructWorkDesignationsAndPeriods(
      work.designations,
      jsPDFInstance,
      cursor,
      standard,
      pageParameters,
    );
    updateFontAndSize(jsPDFInstance, standard.FONT_NAME, FontStyle.REGULAR, cursor.getSize());
    constructWorkDescriptions(work.descriptions, jsPDFInstance, cursor, standard, pageParameters);
    if (index < works.length - 1) {
      enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
    }
  });
}

function constructWorkDesignationsAndPeriods(
  designations: Designation[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  designations.forEach(designation => {
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, designation.title, cursor);
    cursor.setXCoordinate(pageParameters.PORTRAIT_WIDTH - standard.MARGIN);
    const designationPeriodText = `${startCase(designation.start)} – ${startCase(
      designation.end.length > 0 ? designation.end : UNDEFINED_PERIOD_END,
    )}`;
    writeRight(jsPDFInstance, designationPeriodText, cursor);
    enterAndCheckMargin(jsPDFInstance, cursor, standard, pageParameters, DEFAULT_LINE_HEIGHT, 1);
  });
}

function constructWorkDescriptions(
  descriptions: string[],
  jsPDFInstance: jsPDF,
  cursor: Cursor,
  standard: Standard,
  pageParameters: FormatParameters,
): void {
  descriptions.forEach(description => {
    const descriptionTexts: string[] = splitTextToSize(
      jsPDFInstance,
      `${trimEnd(upperFirst(description), ".")}.`,
      pageParameters.PORTRAIT_WIDTH - 2 * standard.MARGIN - BULLETS_WIDTH,
    );
    cursor.setXCoordinate(standard.MARGIN);
    writeLeft(jsPDFInstance, BULLETS, cursor);
    cursor.setXCoordinate(standard.MARGIN + BULLETS_WIDTH);
    writeLeft(jsPDFInstance, descriptionTexts, cursor);
    enterAndCheckMargin(
      jsPDFInstance,
      cursor,
      standard,
      pageParameters,
      DEFAULT_LINE_HEIGHT,
      descriptionTexts.length,
    );
  });
}
