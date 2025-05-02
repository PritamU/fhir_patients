import { Box } from "@mui/material";
import { Route, Routes } from "react-router";
import Header from "./Global/Header";
import HomePage from "./PageComponents/Home";

const Layout = () => {
  return (
    <Box sx={{ padding: "80px 1rem 1rem 1rem" }}>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Box>
  );
};

export default Layout;
