import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { FhirBundle } from "./patientTypes";

// Define a service using a base URL and expected endpoints
export const patientApi = createApi({
  reducerPath: "patientApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER_URL }),
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
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useFetchPatientsQuery } = patientApi;
