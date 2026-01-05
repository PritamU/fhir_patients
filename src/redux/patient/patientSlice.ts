import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { BundleEntry } from "fhir/r4";

export interface PatientSliceInterface {
  patients: BundleEntry[];
  page: number;
  limit: number;
  sortField: string;
  sortValue: "-" | "";
  isLoading: boolean;
  searchKey: string;
  next: string | null;
  modalData: {
    isOpen: boolean;
    type: "edit" | "create" | "delete" | "details";
    data?: BundleEntry;
  };
  snackbar: {
    isOpen: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  };
}

const initialState: PatientSliceInterface = {
  page: 0,
  limit: 10,
  sortField: "_lastUpdated",
  sortValue: "-",
  searchKey: "",
  isLoading: true,
  patients: [],
  next: null,
  modalData: {
    isOpen: false,
    type: "create",
  },
  snackbar: {
    isOpen: false,
    message: "",
    severity: "info",
  },
};

export const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
    setSort: (
      state,
      action: PayloadAction<{ sortField: string; sortValue: "-" | "" }>
    ) => {
      state.sortField = action.payload.sortField;
      state.sortValue = action.payload.sortValue;
    },
    setSearchKey: (state, action: PayloadAction<string>) => {
      state.searchKey = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPatients: (
      state,
      action: PayloadAction<{ patients: BundleEntry[]; next?: string | null }>
    ) => {
      state.patients = action.payload.patients;
      state.next = action.payload.next || null;
      state.isLoading = false;
    },
    setModal: (
      state,
      action: PayloadAction<{
        isOpen: boolean;
        type: "create" | "edit" | "delete" | "details";
        data?: BundleEntry;
      }>
    ) => {
      state.modalData.isOpen = action.payload.isOpen;
      state.modalData.type = action.payload.type;
      state.modalData.data = action.payload.data;
    },
    setSnackbar: (
      state,
      action: PayloadAction<{
        isOpen: boolean;
        message?: string;
        severity?: "success" | "error" | "warning" | "info";
      }>
    ) => {
      const { isOpen, message, severity } = action.payload;
      state.snackbar = {
        isOpen,
        message: message || "",
        severity: severity || "info",
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setPage,
  setIsLoading,
  setLimit,
  setPatients,
  setSearchKey,
  setSort,
  setModal,
  setSnackbar,
} = patientSlice.actions;

export default patientSlice.reducer;
