import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Bundle as FhirBundle, Patient, OperationOutcome, Observation } from "fhir/r4";

// Define a service using a base URL and expected endpoints
export const patientApi = createApi({
  reducerPath: "patientApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
  tagTypes: ["FetchPatients", "FetchObservations"],
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
        `Patient?_count=${limit}&_getpagesoffset=${
          page * limit
        }&_sort=${sortValue}${sortField}${
          searchKey !== "" ? `&name=${searchKey}` : ""
        }`,
      providesTags: ["FetchPatients"],
    }),
    addPatient: build.mutation<{ resourceType: string; id: string }, Patient>({
      query: (data) => ({
        url: `Patient`,
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
        url: `Patient/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FetchPatients"],
    }),
    deletePatient: build.mutation<
      OperationOutcome,
      { id: string }
    >({
      query: (data) => ({
        url: `Patient/${data.id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any, meta) => {
        // If the response is empty (204 No Content), create a success OperationOutcome
        if (!response || meta?.response?.status === 204) {
          return {
            resourceType: "OperationOutcome",
            issue: [{
              severity: "information",
              code: "informational",
              details: {
                coding: [{
                  system: "http://hl7.org/fhir/operation-outcome",
                  code: "SUCCESSFUL_DELETE",
                  display: "Patient successfully deleted"
                }]
              },
              diagnostics: "Patient deleted successfully"
            }]
          } as OperationOutcome;
        }
        return response;
      },
      invalidatesTags: ["FetchPatients"],
    }),
    fetchObservations: build.query<
      FhirBundle,
      { patientId: string }
    >({
      query: ({ patientId }) => `Observation?patient=${patientId}&_sort=-date`,
      providesTags: ['FetchObservations'],
    }),
    addObservation: build.mutation<
      { resourceType: string; id: string },
      Observation
    >({
      query: (data) => ({
        url: `Observation`,
        method: "POST",
        body: data,
      }),
      invalidatesTags:['FetchObservations'],
      // Optimistic update to immediately show the new observation
      async onQueryStarted(observation, { dispatch, queryFulfilled }) {
        const patientId = observation.subject?.reference?.split('/')[1];
        if (!patientId) return;

        // Optimistically update the cache
        const patchResult = dispatch(
          patientApi.util.updateQueryData('fetchObservations', { patientId }, (draft) => {
            if (draft && draft.entry) {
              // Add the new observation to the beginning of the list
              const newEntry = {
                resource: {
                  ...observation,
                  id: `temp-${Date.now()}`, // Temporary ID
                },
                fullUrl: `temp-${Date.now()}`,
              };
              draft.entry.unshift(newEntry);
            }
          })
        );

        try {
          await queryFulfilled;
          // If successful, the cache invalidation will handle the update
        } catch {
          // If failed, revert the optimistic update
          patchResult.undo();
        }
      },
      
    }),
    addObservationsBatch: build.mutation<
      any,
      Observation[]
    >({
      query: (observations) => ({
        // Per FHIR R4 spec, batch is POST of a Bundle (type=batch) to the base URL
        url: ``,
        method: "POST",
        body: {
          resourceType: "Bundle",
          type: "batch",
          entry: observations.map((observation, index) => ({
            fullUrl: `urn:uuid:${index}`,
            resource: observation,
            request: {
              method: "POST",
              url: "Observation"
            }
          }))
        },
      }),
      invalidatesTags:['FetchObservations'],
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
  useFetchObservationsQuery,
  useAddObservationMutation,
  useAddObservationsBatchMutation,
} = patientApi;
