import { Resume } from "../models";

export const EMPTY_RESUME: Resume = {
  header: {
    name: "",
    subtitle: "",
    email: "",
    phone: "",
    leftDetail: "",
    rightDetail: "",
  },
  profile: "",
  competencies: [],
  work: [],
  education: [],
  awardsAndCertifications: [],
};
