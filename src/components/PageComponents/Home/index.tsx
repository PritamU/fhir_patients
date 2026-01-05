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
import PatientDetailsModal from "./PatientDetailsModal";

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
      dispatch(setPatients({ patients: [], next: null }));
    }
    if (isSuccess && data) {
      // Extract next URL from FHIR bundle link
      const nextLink = data.link?.find(link => link.relation === 'next');
      const nextUrl = nextLink?.url || null;
      
      dispatch(setPatients({ 
        patients: data.entry || [],
        next: nextUrl
      }));
    }
  }, [isLoading, isSuccess, isError, data, dispatch]);

  return (
    <Stack gap={2}>
      <Filters />
      <PatientList />
      {modalData.isOpen && modalData.type === "create" && (
        <CreatePatientModal />
      )}
      {modalData.isOpen && modalData.type === "edit" && (
        <CreatePatientModal />
      )}
      {modalData.isOpen && modalData.type === "delete" && (
        <DeletePatientModal />
      )}
      {modalData.isOpen && modalData.type === "details" && (
        <PatientDetailsModal />
      )}
    </Stack>
  );
};

export default HomePage;
