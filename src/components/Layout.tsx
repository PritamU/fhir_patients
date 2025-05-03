import { Alert, Box, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes } from "react-router";
import { setSnackbar } from "../redux/patient/patientSlice";
import { RootState } from "../redux/store";
import Header from "./Global/Header";
import HomePage from "./PageComponents/Home";

const Layout = () => {
  const { snackbar } = useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();
  return (
    <Box sx={{ padding: "80px 1rem 1rem 1rem" }}>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      <Snackbar
        open={snackbar.isOpen}
        autoHideDuration={6000}
        onClose={() => dispatch(setSnackbar({ isOpen: false }))}
      >
        <Alert
          onClose={() => dispatch(setSnackbar({ isOpen: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout;
