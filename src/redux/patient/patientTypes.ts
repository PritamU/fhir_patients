export interface FhirBundle {
  resourceType: "Bundle";
  type: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
}

export interface BundleLink {
  relation: "self" | "next" | "previous" | string;
  url: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource: Patient;
  search?: {
    mode: string;
    score?: number;
  };
}

export interface Patient {
  resourceType: "Patient";
  id: string;
  name?: HumanName[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  address?: Address[];
  telecom?: ContactPoint[];
  meta: {
    lastUpdated: Date;
  };
  // Add other fields as needed
}

export interface HumanName {
  use?: "official" | "usual" | "nickname" | "anonymous" | "old" | "maiden";
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  text?: string;
}

export interface Address {
  use?: "home" | "work" | "temp" | "old";
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  text?: string;
}

export interface ContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
}
