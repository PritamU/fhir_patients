import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  useAddPatientMutation,
  useUpdatePatientMutation,
} from "../../../redux/patient/patientApi";
import { setModal, setSnackbar } from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";

import dayjs from "dayjs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import {
  FhirErrorInterface,
  Patient,
} from "../../../redux/patient/patientTypes";

const formSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  gender: yup.string().required("Gender is required"),
  birthDate: yup.string().required("BirthDate is required"),
  // .date()
  // .typeError("Invalid BirthDate!"),
  address: yup.string().required("Address is required"),
  district: yup.string().required("District is required"),
  state: yup.string().required("State is required"),
  postalCode: yup
    .string()
    .required("Pincode is required")
    .matches(/^[1-9][0-9]{5}$/, "Invalid Pincode"),
  phoneNumber: yup
    .string()
    .required("Phone Number is required")
    .matches(/^[6-9]\d{9}$/, "Invalid Phone Number"),
});

type FormData = yup.InferType<typeof formSchema>;

const CreatePatientModal = () => {
  const { modalData } = useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();

  const { isOpen, type, data } = modalData;

  const [
    addPatient,
    {
      isLoading: isAddPatientLoading,
      isError: isAddPatientError,
      isSuccess: isAddPatientSuccess,
      error: addPatientError,
    },
  ] = useAddPatientMutation();

  const [
    updatePatient,
    {
      isLoading: isUpdatePatientLoading,
      isError: isUpdatePatientError,
      isSuccess: isUpdatePatientSuccess,
      error: updatePatientError,
    },
  ] = useUpdatePatientMutation();

  const isLoading = isAddPatientLoading || isUpdatePatientLoading;

  const handleModalClose = () => {
    if (!isLoading) {
      dispatch(setModal({ type: "create", isOpen: false }));
    }
  };

  // use effect to handle add patient api response
  useEffect(() => {
    if (isAddPatientError) {
      console.log("addPatientError", addPatientError);
      const { data } = addPatientError as {
        status: number;
        data: FhirErrorInterface;
      };
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "error",
          message: data.issue[0].diagnostics,
        })
      );
    }
    if (isAddPatientSuccess) {
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "success",
          message: "New Patient has been Added!",
        })
      );
      dispatch(setModal({ isOpen: false, type: "create" }));
    }
  }, [
    isAddPatientError,
    isAddPatientLoading,
    isAddPatientSuccess,
    addPatientError,
    dispatch,
  ]);

  // use effect to handle edit patient api response
  useEffect(() => {
    if (isUpdatePatientError) {
      const { data } = updatePatientError as {
        status: number;
        data: FhirErrorInterface;
      };
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "error",
          message: data.issue[0].diagnostics,
        })
      );
    }
    if (isUpdatePatientSuccess) {
      dispatch(
        setSnackbar({
          isOpen: true,
          severity: "success",
          message: "Patient Details has been Updated!",
        })
      );
      dispatch(setModal({ isOpen: false, type: "create" }));
    }
  }, [
    isUpdatePatientError,
    isUpdatePatientLoading,
    isUpdatePatientSuccess,
    updatePatientError,
    dispatch,
  ]);

  // react hook form config
  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: type === "edit" ? `${data?.resource.name![0].text}` : "",
      gender: type === "edit" ? `${data?.resource.gender}` : "",
      birthDate: type === "edit" ? `${data?.resource.birthDate}` : undefined,
      address: type === "edit" ? `${data?.resource.address![0].text}` : "",
      district: type === "edit" ? `${data?.resource.address![0].district}` : "",
      state: type === "edit" ? `${data?.resource.address![0].state}` : "",
      postalCode:
        type === "edit" ? `${data?.resource.address![0].postalCode}` : "",
      phoneNumber: type === "edit" ? `${data?.resource.telecom![0].value}` : "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfirm = (data: any) => {
    const {
      address,
      birthDate,
      district,
      gender,
      name,
      phoneNumber,
      postalCode,
      state,
    } = data as FormData;
    const payload: Patient = {
      resourceType: "Patient",
      name: [
        {
          use: "official",
          text: name,
        },
      ],
      gender: gender,
      birthDate: dayjs(birthDate).format("YYYY-MM-DD"),
      address: [
        {
          text: address,
          district,
          state,
          postalCode,
        },
      ],
      telecom: [
        {
          system: "phone",
          value: phoneNumber,
        },
      ],
    };
    if (type === "create") {
      addPatient(payload);
    } else if (type === "edit") {
      const modifiedPayload = { ...payload, id: modalData.data!.resource.id! };

      updatePatient(modifiedPayload);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleModalClose}
      fullWidth
      component={"form"}
      onSubmit={handleSubmit(handleConfirm)}
    >
      <DialogTitle sx={{ textTransform: "capitalize" }}>
        {modalData.type} Patient
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} p={2}>
          <TextField
            size="small"
            {...register("name")}
            label="Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            select
            {...register("gender")}
            label="Gender"
            error={!!errors.gender}
            helperText={errors.gender?.message}
            slotProps={{ inputLabel: { shrink: true } }}
            defaultValue={
              type === "edit" ? `${data?.resource.gender}` : "string"
            }
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="date"
            {...register("birthDate")}
            label="Date of Birth"
            error={!!errors.birthDate}
            helperText={errors.birthDate?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            {...register("address")}
            label="Address"
            error={!!errors.address}
            helperText={errors.address?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            {...register("district")}
            label="District"
            error={!!errors.district}
            helperText={errors.district?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            {...register("state")}
            label="State"
            error={!!errors.state}
            helperText={errors.state?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="number"
            size="small"
            {...register("postalCode")}
            label="Pincode"
            error={!!errors.postalCode}
            helperText={errors.postalCode?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="tel"
            size="small"
            {...register("phoneNumber")}
            label="Phone Number"
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          loading={isLoading}
          variant="outlined"
          onClick={() => handleModalClose()}
        >
          Close
        </Button>
        <Button loading={isLoading} type="submit" variant="contained">
          {isLoading ? "Loading..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePatientModal;
