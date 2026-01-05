import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDeletePatientMutation } from "../../../redux/patient/patientApi";
import { setModal, setSnackbar } from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";
import type { Patient } from "fhir/r4";
import type { FhirErrorResponse } from "../../../redux/patient/patientTypes";

const DeletePatientModal = () => {
  const { modalData } = useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();

  const [deletePatient, { isLoading, isError, isSuccess, error, data }] =
    useDeletePatientMutation();

  const handleModalClose = () => {
    if (!isLoading) {
      dispatch(setModal({ isOpen: false, type: "delete" }));
    }
  };

  useEffect(() => {
    if (isError) {
      const { data } = error as { status: number; data: FhirErrorResponse };
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "error",
          message: data?.issue?.[0]?.diagnostics || "An error occurred while deleting the patient",
        })
      );
    }
    if (isSuccess) {
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "success",
          message: "Patient Deleted Successfully",
        })
      );
      // Close the modal
      dispatch(setModal({ isOpen: false, type: "delete" }));
    }
  }, [isLoading, isSuccess, isError, error, data, dispatch]);

  // Safely access patient data with proper typing
  const patient = modalData.data?.resource as Patient | undefined;
  const patientName = patient?.name?.[0]?.text || patient?.name?.[0]?.given?.join(" ") || "Unknown Patient";

  return (
    <Dialog open={modalData.isOpen} onClose={handleModalClose} fullWidth>
      <DialogTitle>Delete Patient?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this patient named{" "}
          <span style={{ fontWeight: "bold" }}>
            {" "}
            {patientName}
          </span>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          disabled={isLoading}
          onClick={() => handleModalClose()}
          color="error"
        >
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isLoading}
          onClick={() => {
            const id = patient?.id;
            if (id) {
              deletePatient({ id });
            }
          }}
        >
          {isLoading ? "Loading..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePatientModal;
