import { jsPDF } from "jspdf";
import { Resume } from "../../../models";
import { calibriNormal, calibriBold } from "../../../fonts";
import { Cursor } from "../../../class";
import {
  A4Parameters,
  DEFAULT_LINE_HEIGHT,
  OnePageStandard,
} from "../constants/one-page-standard.constants";
import { constructHeader, constructSectionHeader } from "./headers";
import {
  constructAwardsAndCertificationsContent,
  constructProfileContent,
  constructCoreCompetenciesContent,
  constructEducationContent,
  constructWorkExperienceContent,
} from "./contents";
import { addLineSpace } from "../../../utils";

export function generateOnePageStandardPDF(
  resume: Resume,
  jsPDFInstance: jsPDF,
  cursor: Cursor,
): void {
  /** Add fonts */
  jsPDFInstance.addFileToVFS("Calibri-normal.ttf", calibriNormal);
  jsPDFInstance.addFont("Calibri-normal.ttf", "Calibri", "normal");
  jsPDFInstance.addFileToVFS("Calibri-bold.ttf", calibriBold);
  jsPDFInstance.addFont("Calibri-bold.ttf", "Calibri", "bold");

  /** Construct Page Header */
  constructHeader(resume.header, jsPDFInstance, cursor, OnePageStandard, A4Parameters);

  /** Line Space */
  addLineSpace(jsPDFInstance, cursor, OnePageStandard, A4Parameters, DEFAULT_LINE_HEIGHT);

  /** Construct Personal Profile */
  // Section Header
  constructSectionHeader("PERSONAL PROFILE", jsPDFInstance, cursor, OnePageStandard, A4Parameters);
  // Section Content
  constructProfileContent(resume.profile, jsPDFInstance, cursor, OnePageStandard, A4Parameters);

  /** Line Space */
  addLineSpace(jsPDFInstance, cursor, OnePageStandard, A4Parameters, DEFAULT_LINE_HEIGHT);

  /** Construct Core Competencies */
  // Section Header
  constructSectionHeader("CORE COMPETENCIES", jsPDFInstance, cursor, OnePageStandard, A4Parameters);
  // Section Content
  constructCoreCompetenciesContent(
    resume.competencies,
    jsPDFInstance,
    cursor,
    OnePageStandard,
    A4Parameters,
  );

  /** Line Space */
  addLineSpace(jsPDFInstance, cursor, OnePageStandard, A4Parameters, DEFAULT_LINE_HEIGHT);

  /** Construct Work Experience */
  // Section Header
  constructSectionHeader("WORK EXPERIENCE", jsPDFInstance, cursor, OnePageStandard, A4Parameters);
  // Section Content
  constructWorkExperienceContent(resume.work, jsPDFInstance, cursor, OnePageStandard, A4Parameters);

  /** Line Space */
  addLineSpace(jsPDFInstance, cursor, OnePageStandard, A4Parameters, DEFAULT_LINE_HEIGHT);

  /** Construct Education */
  // Section Header
  constructSectionHeader("EDUCATION", jsPDFInstance, cursor, OnePageStandard, A4Parameters);
  // Section Content
  constructEducationContent(resume.education, jsPDFInstance, cursor, OnePageStandard, A4Parameters);

  /** Line Space */
  addLineSpace(jsPDFInstance, cursor, OnePageStandard, A4Parameters, DEFAULT_LINE_HEIGHT);

  /** Construct Awards & Certifications */
  // Section Header
  constructSectionHeader(
    "AWARDS AND CERTIFICATIONS",
    jsPDFInstance,
    cursor,
    OnePageStandard,
    A4Parameters,
  );
  // Section Content
  constructAwardsAndCertificationsContent(
    resume.awardsAndCertifications,
    jsPDFInstance,
    cursor,
    OnePageStandard,
    A4Parameters,
  );

  // View PDF
  jsPDFInstance.output("dataurlnewwindow");
}
