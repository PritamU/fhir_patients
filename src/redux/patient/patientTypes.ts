import type { Patient, BundleEntry, OperationOutcome } from "fhir/r4";

export type { Patient, BundleEntry, OperationOutcome };

// Type for FHIR error responses
export interface FhirErrorResponse {
  resourceType: "OperationOutcome";
  issue: Array<{
    severity: "information" | "warning" | "error" | "fatal";
    code: "informational" | "processing" | "not-found" | "conflict" | string;
    details?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    diagnostics?: string;
  }>;
} 