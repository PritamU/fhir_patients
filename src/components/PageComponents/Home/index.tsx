import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFetchPatientsQuery } from "../../../redux/patient/patientApi";
import { setIsLoading, setPatients } from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";
import CreatePatientModal from "./CreatePatientModal";
import DeletePatientModal from "./DeletePatientModal";
import Filters from "./Filters";
import PatientList from "./PatientList";

const HomePage = () => {
  const { modalData, searchKey, page, limit, sortField, sortValue } =
    useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();

  const { isLoading, isError, isSuccess, data } = useFetchPatientsQuery({
    page,
    limit,
    sortField,
    sortValue,
    searchKey,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setIsLoading(true));
    }
    if (isError) {
      dispatch(setPatients({ count: 0, patients: [] }));
    }
    if (isSuccess) {
      dispatch(setPatients({ count: data.total!, patients: data.entry || [] }));
    }
  }, [isLoading, isSuccess, isError, data, dispatch]);

  return (
    <Stack gap={2}>
      <Filters />
      <PatientList />
      {modalData.isOpen && modalData.type !== "delete" && (
        <CreatePatientModal />
      )}
      {modalData.isOpen && modalData.type === "delete" && (
        <DeletePatientModal />
      )}
    </Stack>
  );
};

export default HomePage;
