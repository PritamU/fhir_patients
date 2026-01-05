import { Delete, Edit, NavigateNext, Visibility } from "@mui/icons-material";
import {
  Avatar,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { tableColumns } from "../../../assets/constants/tableColumns";
import {
  setLimit,
  setModal,
  setPage,
  setSort,
} from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";
import type { Patient } from "fhir/r4";

const PatientList = () => {
  const { sortField, sortValue, isLoading, patients, limit, page, next } =
    useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();
  
  const handleNextPage = () => {
    if (next) {
      dispatch(setPage(page + 1));
    }
  };

  return (
    <React.Fragment>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {tableColumns.map((item, index) => {
                return (
                  <TableCell key={index}>
                    <TableSortLabel
                      active={sortField === item.id}
                      direction={sortValue === "" ? "asc" : "desc"}
                      onClick={() => {
                        if (item.showSort) {
                          if (item.id === sortField) {
                            dispatch(
                              setSort({
                                sortField: sortField,
                                sortValue: sortValue === "" ? "-" : "",
                              })
                            );
                          } else {
                            dispatch(
                              setSort({
                                sortField: item.id,
                                sortValue: "",
                              })
                            );
                          }
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {item.title}
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          {isLoading && (
            <TableBody>
              {Array(5)
                .fill("")
                .map((_, rowIndex) => {
                  return (
                    <TableRow
                      key={rowIndex}
                      sx={{ maxHeight: "50px !important" }}
                    >
                      {Array(tableColumns.length)
                        .fill("")
                        .map((_, cellIndex) => {
                          return (
                            <TableCell key={cellIndex}>
                              <Skeleton variant="rectangular" />
                            </TableCell>
                          );
                        })}
                    </TableRow>
                  );
                })}
            </TableBody>
          )}
          <TableBody>
            {patients.length > 0 && (
              <React.Fragment>
                {patients.map((item, index) => {
                  const { resource } = item;
                  if (!resource) return null;
                  const { name, gender, birthDate, telecom, address, meta } =
                    resource as Patient;
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {name?.[0]?.text || name?.[0]?.given?.join(" ") || "N/A"}
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {gender || "N/A"}
                      </TableCell>
                      <TableCell>
                        {birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {address?.[0] ? (
                          [
                            address[0].text,
                            address[0].district,
                            address[0].state,
                            address[0].postalCode
                          ].filter(Boolean).join(", ") || "N/A"
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {telecom?.[0]?.value || "N/A"}
                      </TableCell>
                      <TableCell>
                        {meta?.lastUpdated ? dayjs(meta.lastUpdated).format("YYYY-MM-DD") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Stack flexDirection={"row"} alignItems={"center"}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              dispatch(
                                setModal({
                                  type: "details",
                                  isOpen: true,
                                  data: item,
                                })
                              )
                            }
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() =>
                              dispatch(
                                setModal({
                                  type: "edit",
                                  isOpen: true,
                                  data: item,
                                })
                              )
                            }
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              dispatch(
                                setModal({
                                  isOpen: true,
                                  type: "delete",
                                  data: item,
                                })
                              );
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {patients.length !== 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TablePagination
            rowsPerPageOptions={[10, 20, 30]}
            component="div"
            count={-1}
            rowsPerPage={limit}
            page={page}
            onPageChange={(_, newPage) => dispatch(setPage(newPage))}
            onRowsPerPageChange={(e) => {
              dispatch(setLimit(Number(e.target.value)));
            }}
          />
          {next && (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={handleNextPage}
              disabled={isLoading}
            >
              Next Page
            </Button>
          )}
        </Stack>
      )}
      {patients.length === 0 && !isLoading && (
        <Stack
          justifyContent={"center"}
          alignItems={"center"}
          height={"60vh"}
          gap={2}
          textAlign={"center"}
        >
          <Avatar
            src="/not-found.png"
            alt="Data Not Found"
            sx={{ height: 100, width: 100 }}
          />
          <Typography variant="h5">Oops! No Patients Found!</Typography>
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            Click on 'Add Patient" to add New Patients which will be listed
            here.{" "}
          </Typography>
        </Stack>
      )}
    </React.Fragment>
  );
};

export default PatientList;
