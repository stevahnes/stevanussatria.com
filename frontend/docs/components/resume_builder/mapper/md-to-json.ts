import { Resume, Header, Work, Education, AwardsAndCertification, Designation } from "../models";

/**
 * Maps markdown text to a Resume object
 * @param markdown The resume markdown content
 * @returns Resume object conforming to the specified interface
 */
export function parseResumeMarkdown(markdown: string): Resume {
  const sections = splitIntoSections(markdown);
  return {
    header: parseHeader(sections.header),
    profile: sections.profile.trim(),
    competencies: parseCompetencies(sections.competencies),
    work: parseWork(sections.work),
    education: parseEducation(sections.education),
    awardsAndCertifications: parseAwardsAndCertifications(sections.awardsAndCertifications),
  };
}

/**
 * Split markdown content into logical sections
 */
function splitIntoSections(markdown: string) {
  const lines = markdown.split("\n");
  const sections: Record<string, string> = {
    header: "",
    profile: "",
    competencies: "",
    work: "",
    education: "",
    awardsAndCertifications: "",
  };

  let currentSection = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## Personal Profile")) {
      currentSection = "profile";
      continue;
    } else if (line.startsWith("## Core Competencies")) {
      currentSection = "competencies";
      continue;
    } else if (line.startsWith("## Work Experience")) {
      currentSection = "work";
      continue;
    } else if (line.startsWith("## Education")) {
      currentSection = "education";
      continue;
    } else if (line.startsWith("## Awards and Certifications")) {
      currentSection = "awardsAndCertifications";
      continue;
    }

    sections[currentSection] += line + "\n";
  }

  return sections;
}

/**
 * Extract content from markdown link
 * @param text Text containing markdown links
 * @param preferLabel Whether to prefer the label over the URL
 * @returns Cleaned text with links processed
 */
function processMarkdownLinks(text: string, preferLabel: boolean = true): string {
  // Handle empty links [](link) - remove them entirely
  text = text.replace(/\[\]\(([^)]+)\)/g, "");

  // Handle regular links [label](link)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, label: string, url: string) => {
    return preferLabel ? label : url;
  });

  return text.trim();
}

/**
 * Parse the header section
 */
function parseHeader(headerSection: string): Header {
  const lines = headerSection.trim().split("\n");
  const name = processMarkdownLinks(lines[0].replace("# ", "").trim(), true);

  // Extract contact information from second line
  const contactLine = lines[2] || "";
  const contactItems = contactLine
    .split("|")
    .map(item => item.trim())
    .filter(Boolean);

  let email = "";
  let phone = "";
  let leftDetail = "";
  let rightDetail = "";

  contactItems.forEach(item => {
    // Process email
    if (item.includes("@")) {
      email = item.trim();
      // Make sure to preserve the domain in email addresses
      email = processMarkdownLinks(email, true);
    }
    // Process phone
    else if (item.match(/\(\d+\)/) || item.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
      phone = processMarkdownLinks(item, true);
    }
    // Process LinkedIn or left detail
    else if (item.toLowerCase().includes("linkedin")) {
      leftDetail = processMarkdownLinks(item, false);
    }
    // Process website or right detail
    else if (item.includes("www.") || item.includes("http")) {
      rightDetail = processMarkdownLinks(item, true);
    }
  });

  return {
    name,
    subtitle: "", // No subtitle in the provided markdown
    email,
    phone,
    leftDetail,
    rightDetail,
  };
}

/**
 * Parse the competencies section
 */
function parseCompetencies(competenciesSection: string): string[] {
  if (!competenciesSection) return [];

  // Extract competencies from bullet point list
  const competenciesText = competenciesSection.trim();
  return competenciesText
    .split("•")
    .map(item => processMarkdownLinks(item.trim(), true))
    .filter(item => item !== "");
}

/**
 * Parse the work section
 */
function parseWork(workSection: string): Work[] {
  if (!workSection) return [];

  const workEntries: Work[] = [];
  const companyBlocks = workSection.split(/(?=### )/g).filter(block => block.trim() !== "");

  companyBlocks.forEach(block => {
    const lines = block.trim().split("\n");
    const companyLine = lines[0].replace("### ", "").trim();
    const company = processMarkdownLinks(companyLine, true);

    // Find detail lines (which contain title, location, and period)
    const detailLines: string[] = [];
    let currentLineIndex = 1;

    // Skip any empty lines after company name
    while (currentLineIndex < lines.length && lines[currentLineIndex].trim() === "") {
      currentLineIndex++;
    }

    // Collect all detail lines (they contain '|' character and come before bullet points)
    while (
      currentLineIndex < lines.length &&
      lines[currentLineIndex].includes("|") &&
      !lines[currentLineIndex].trim().startsWith("-")
    ) {
      detailLines.push(lines[currentLineIndex].trim());
      currentLineIndex++;
    }

    // Skip any empty lines after detail lines
    while (currentLineIndex < lines.length && lines[currentLineIndex].trim() === "") {
      currentLineIndex++;
    }

    // Extract descriptions (bullet points)
    const descriptions: string[] = [];
    for (let i = currentLineIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("-")) {
        descriptions.push(processMarkdownLinks(line.substring(1).trim(), true));
      }
    }

    // Parse detail lines into designations
    const designations: Designation[] = [];
    detailLines.forEach(detailLine => {
      const detailsParts = detailLine.split("|").map(part => part.trim());

      const titlePart = detailsParts[0] || "";
      const periodPart = detailsParts[2] || "";

      const title = processMarkdownLinks(titlePart.replace(/\*\*/g, "").trim(), true);

      // Parse period for the designation
      const periodMatch = periodPart.match(/(\w+ \d{4}).*?(\w+ \d{4}|Present)/);
      const start = periodMatch ? periodMatch[1] : "";
      const end = periodMatch ? periodMatch[2] : "";

      designations.push({
        title,
        start,
        end,
        descriptions: [], // Individual designations don't have descriptions in this format
      });
    });

    workEntries.push({
      company,
      location: processMarkdownLinks(detailLines[0].split("|").map(part => part.trim())[1], true),
      designations,
      descriptions, // All descriptions belong to the company as a whole
    });
  });

  return workEntries;
}

/**
 * Parse the education section
 */
function parseEducation(educationSection: string): Education[] {
  if (!educationSection) return [];

  const educationEntries: Education[] = [];
  const institutionBlocks = educationSection
    .split(/(?=### )/g)
    .filter(block => block.trim() !== "");

  institutionBlocks.forEach(block => {
    const lines = block.trim().split("\n");
    const institutionLine = lines[0].replace("### ", "").trim();
    const institution = processMarkdownLinks(institutionLine, true);

    // Qualification on second line
    const qualificationLine = lines[2] || "";
    const qualificationParts = qualificationLine
      .split("|")
      .map(part => part.replace("**", "").replace("**", "").trim());

    const qualificationPart = qualificationParts[0] || "";
    const periodPart = qualificationParts[1] || "";

    const qualification = processMarkdownLinks(qualificationPart, true);

    // Period on the same line as qualification or next line
    const periodMatch = periodPart.match(/(\w+ \d{4}).*?(\w+ \d{4}|Present)/);
    const start = periodMatch ? periodMatch[1] : "";
    const end = periodMatch ? periodMatch[2] : "";

    let honorsAndGrade: string | undefined;
    // Check if there's an honors line
    if (lines.length > 3) {
      const potentialHonorsLine = lines[4]?.trim() || "";
      if (!potentialHonorsLine.startsWith("###") && potentialHonorsLine !== "") {
        honorsAndGrade = processMarkdownLinks(potentialHonorsLine, true);
      }
    }

    educationEntries.push({
      institution,
      qualification,
      start,
      end,
      honorsAndGrade,
    });
  });

  return educationEntries;
}

/**
 * Parse the awards and certifications section
 */
function parseAwardsAndCertifications(awardsSection: string): AwardsAndCertification[] {
  if (!awardsSection) return [];

  const awards: AwardsAndCertification[] = [];
  const lines = awardsSection.trim().split("\n");

  lines.forEach(line => {
    if (line.startsWith("-")) {
      let awardText = line.substring(1).trim();

      // Process any markdown links in the award text
      awardText = processMarkdownLinks(awardText, true);

      const dateMatch = awardText.match(/\| (\w+ \d{4})$/);

      if (dateMatch) {
        const acquiredDate = dateMatch[1];
        // Remove the date part from the name
        const name = awardText.replace(/\| \w+ \d{4}$/, "").trim();

        awards.push({
          name,
          acquiredDate,
        });
      } else {
        // If no date pattern found, add the whole text as name with empty date
        awards.push({
          name: awardText,
          acquiredDate: "",
        });
      }
    }
  });

  return awards;
}
