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
import { FhirErrorInterface } from "../../../redux/patient/patientTypes";
import { RootState } from "../../../redux/store";

const DeletePatientModal = () => {
  const { modalData } = useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();

  const [deletePatient, { isLoading, isError, isSuccess, error }] =
    useDeletePatientMutation();

  const handleModalClose = () => {
    if (!isLoading) {
      dispatch(setModal({ isOpen: false, type: "create" }));
    }
  };

  useEffect(() => {
    if (isError) {
      const { data } = error as { status: number; data: FhirErrorInterface };
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "error",
          message: data.issue[0].diagnostics,
        })
      );
    }
    if (isSuccess) {
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "success",
          message: "Patient Deleted",
        })
      );
      dispatch(setModal({ isOpen: false, type: "create" }));
    }
  }, [isLoading, isSuccess, isError, error, dispatch]);

  return (
    <Dialog open={modalData.isOpen} onClose={handleModalClose} fullWidth>
      <DialogTitle>Delete Patient?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this patient named{" "}
          <span style={{ fontWeight: "bold" }}>
            {" "}
            {modalData.data?.resource.name![0].text}
          </span>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          loading={isLoading}
          onClick={() => handleModalClose()}
          color="error"
        >
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          loading={isLoading}
          onClick={() => {
            const id = modalData.data?.resource!.id as string;
            deletePatient({ id });
          }}
        >
          {isLoading ? "Loading..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePatientModal;
