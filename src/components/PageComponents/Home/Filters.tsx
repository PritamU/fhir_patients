import { Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setModal, setSearchKey } from "../../../redux/patient/patientSlice";
import useDebounce from "../../../utils/useDebounce";

const Filters = () => {
  const [localSearchKey, setLocalSearchKey] = useState("");
  const dispatch = useDispatch();

  const debouncedSearch = useDebounce(localSearchKey, 500);
  console.log("debouncedSearch", debouncedSearch);

  useEffect(() => {
    console.log("use Effect", debouncedSearch);
    dispatch(setSearchKey(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  return (
    <Stack
      flexDirection={"row"}
      alignItems={"center"}
      justifyContent={"flex-end"}
      gap={2}
    >
      <TextField
        size="small"
        value={localSearchKey}
        onChange={(e) => setLocalSearchKey(e.target.value)}
        label="Search by Name"
      />
      <Button
        variant="contained"
        size="small"
        onClick={() => dispatch(setModal({ isOpen: true, type: "create" }))}
      >
        Add Patient
      </Button>
    </Stack>
  );
};

export default Filters;
