import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { FhirBundle, Patient } from "./patientTypes";

// Define a service using a base URL and expected endpoints
export const patientApi = createApi({
  reducerPath: "patientApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
  tagTypes: ["FetchPatients"],
  endpoints: (build) => ({
    fetchPatients: build.query<
      FhirBundle,
      {
        page: number;
        limit: number;
        sortField: string;
        sortValue: "-" | "";
        searchKey: string;
      }
    >({
      query: ({ limit, page, searchKey, sortField, sortValue }) =>
        `?_count=${limit}&_getpagesoffset=${
          page * limit
        }&_sort=${sortValue}${sortField}${
          searchKey !== "" ? `&name=${searchKey}` : ""
        }`,
      providesTags: ["FetchPatients"],
    }),
    addPatient: build.mutation<{ resourceType: string; id: string }, Patient>({
      query: (data) => ({
        url: ``,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FetchPatients"],
    }),
    updatePatient: build.mutation<
      { resourceType: string; id: string },
      Patient & { id: string }
    >({
      query: (data) => ({
        url: `/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FetchPatients"],
    }),
    deletePatient: build.mutation<
      {
        resourceType: "OperationOutcome";
        issue: Array<{
          severity: "information" | string;
          code: "informational" | string;
          details?: {
            coding: Array<{
              system: string;
              code: string;
              display: string;
            }>;
          };
          diagnostics?: string;
        }>;
      },
      { id: string }
    >({
      query: (data) => ({
        url: `/${data.id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FetchPatients"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useFetchPatientsQuery,
  useAddPatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
} = patientApi;
