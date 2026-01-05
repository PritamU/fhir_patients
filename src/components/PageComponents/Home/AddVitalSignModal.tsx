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
import dayjs from "dayjs";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import type { Observation } from "fhir/r4";

const formSchema = yup.object().shape({
  systolic: yup.number().required("Systolic is required").positive("Must be positive"),
  diastolic: yup.number().required("Diastolic is required").positive("Must be positive"),
  effectiveDateTime: yup.string().required("Date and time is required"),
  status: yup.string().required("Status is required"),
  notes: yup.string().optional().default(""),
});

type FormData = yup.InferType<typeof formSchema>;

interface AddVitalSignModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (observation: Observation) => void;
  patientId: string;
  isLoading: boolean;
}

const AddVitalSignModal: React.FC<AddVitalSignModalProps> = ({
  open,
  onClose,
  onSubmit,
  patientId,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      systolic: undefined,
      diastolic: undefined,
      effectiveDateTime: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      status: "final",
      notes: "",
    },
  });

  const handleConfirm: SubmitHandler<FormData> = (formData) => {
    let { effectiveDateTime, systolic, diastolic, status, notes } = formData;
    // Ensure seconds are present
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(effectiveDateTime)) {
      effectiveDateTime += ":00";
    }

    const observation: Observation = {
      resourceType: "Observation",
      status: status as "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled" | "entered-in-error" | "unknown",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "85354-9",
            display: "Blood pressure panel",
          },
        ],
        text: "Blood Pressure",
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: effectiveDateTime,
      component: [
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8480-6",
                display: "Systolic blood pressure",
              },
            ],
            text: "Systolic blood pressure",
          },
          valueQuantity: {
            value: systolic,
            unit: "mmHg",
            system: "http://unitsofmeasure.org",
            code: "mm[Hg]",
          },
        },
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8462-4",
                display: "Diastolic blood pressure",
              },
            ],
            text: "Diastolic blood pressure",
          },
          valueQuantity: {
            value: diastolic,
            unit: "mmHg",
            system: "http://unitsofmeasure.org",
            code: "mm[Hg]",
          },
        },
      ],
      ...(notes && {
        note: [
          {
            text: notes,
          },
        ],
      }),
    };

    onSubmit(observation);
    reset();
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Blood Pressure</DialogTitle>
      <DialogContent>
        <Stack gap={2} p={2} component="form" onSubmit={handleSubmit(handleConfirm)}>
          <TextField
            size="small"
            type="number"
            {...register("systolic", { valueAsNumber: true })}
            label="Systolic (mmHg)"
            error={!!errors.systolic}
            helperText={errors.systolic?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            size="small"
            type="number"
            {...register("diastolic", { valueAsNumber: true })}
            label="Diastolic (mmHg)"
            error={!!errors.diastolic}
            helperText={errors.diastolic?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            size="small"
            type="datetime-local"
            {...register("effectiveDateTime")}
            label="Date & Time"
            error={!!errors.effectiveDateTime}
            helperText={errors.effectiveDateTime?.message}
            slotProps={{ inputLabel: { shrink: true } }}
            inputProps={{ step: 1 }}
          />

          <TextField
            size="small"
            select
            {...register("status")}
            label="Status"
            error={!!errors.status}
            helperText={errors.status?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="registered">Registered</MenuItem>
            <MenuItem value="preliminary">Preliminary</MenuItem>
            <MenuItem value="final">Final</MenuItem>
            <MenuItem value="amended">Amended</MenuItem>
            <MenuItem value="corrected">Corrected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="entered-in-error">Entered in Error</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </TextField>

          <TextField
            size="small"
            multiline
            rows={3}
            {...register("notes")}
            label="Notes (Optional)"
            error={!!errors.notes}
            helperText={errors.notes?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleConfirm)}
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add Blood Pressure"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVitalSignModal; 