import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { tableColumns } from "../../../assets/constants/tableColumns";
import { setSort } from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";

const PatientList = () => {
  const { count, sortField, sortValue, isLoading, patients } = useSelector(
    (state: RootState) => state.patient
  );
  const dispatch = useDispatch();
  return (
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
                  <TableRow key={rowIndex}>
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
          {count === 0 ? (
            <TableRow>
              <TableCell colSpan={tableColumns.length}>
                <Typography variant="body1" textAlign={"center"}>
                  No Data Found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
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
                    <TableCell>{gender}</TableCell>
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
  );
};

export default PatientList;
