import {
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
  setPage,
  setSort,
} from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";

const PatientList = () => {
  const { count, sortField, sortValue, isLoading, patients, limit, page } =
    useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();
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
                      {item.title}
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
            {count > 0 && (
              <React.Fragment>
                {patients.map((item, index) => {
                  const { resource } = item;
                  const { name, gender, birthDate, telecom, address, meta } =
                    resource;
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {name![0].given![0]} {name![0].family}
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {gender}
                      </TableCell>
                      <TableCell>{birthDate}</TableCell>
                      <TableCell>{address?.[0]?.city}</TableCell>
                      <TableCell>{telecom?.[0].value}</TableCell>
                      <TableCell>
                        {dayjs(meta.lastUpdated).format("YYYY-MM-DD")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {count !== 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 20, 30]}
          component="div"
          count={count}
          rowsPerPage={limit}
          page={page}
          onPageChange={(_, newPage) => dispatch(setPage(newPage))}
          onRowsPerPageChange={(e) => {
            dispatch(setLimit(Number(e.target.value)));
          }}
        />
      )}
      {count === 0 && !isLoading && (
        <Stack justifyContent={"center"} alignItems={"center"} height={"60vh"}>
          <Typography>No Data Found</Typography>
        </Stack>
      )}
    </React.Fragment>
  );
};

export default PatientList;
