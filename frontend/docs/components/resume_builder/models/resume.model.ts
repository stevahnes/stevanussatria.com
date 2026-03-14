export interface Resume {
  header: Header;
  profile: string;
  competencies: string[];
  work: Work[];
  education: Education[];
  awardsAndCertifications: AwardsAndCertification[];
}

export interface Header {
  name: string;
  subtitle: string;
  email: string;
  phone: string;
  leftDetail: string;
  rightDetail: string;
}

export interface OldWork {
  company: string;
  location: string;
  designations: string[];
  periods: Period[];
  descriptions: string[];
}

export interface Work {
  company: string;
  location: string;
  designations: Designation[];
  descriptions: string[];
}

export interface OldEducation {
  institution: string;
  qualification: string[];
  period: Period;
  honorsAndGrade?: string;
}

export interface Education {
  institution: string;
  qualification: string;
  start: string;
  end: string;
  honorsAndGrade?: string;
}

export interface AwardsAndCertification {
  name: string;
  acquiredDate: string;
}

export interface Designation {
  title: string;
  start: string;
  end: string;
  descriptions: string[];
}

export interface Period {
  start: string;
  end: string;
}
