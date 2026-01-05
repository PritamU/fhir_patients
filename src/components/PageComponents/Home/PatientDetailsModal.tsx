import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from "dayjs";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFetchObservationsQuery, useAddObservationMutation, useAddObservationsBatchMutation } from "../../../redux/patient/patientApi";
import { setModal, setSnackbar } from "../../../redux/patient/patientSlice";
import { RootState } from "../../../redux/store";
import type { Patient, Observation } from "fhir/r4";
import AddVitalSignModal from "./AddVitalSignModal";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BP = { code: "blood-pressure", loincCode: "85354-9", name: "Blood Pressure", unit: "mmHg", minSys: 90, maxSys: 180, minDia: 60, maxDia: 120 };

const PatientDetailsModal = () => {
  const { modalData } = useSelector((state: RootState) => state.patient);
  const dispatch = useDispatch();
  
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newlyAddedObservations, setNewlyAddedObservations] = useState<Observation[]>([]);

  const patient = modalData.data?.resource as Patient | undefined;
  const patientId = patient?.id;

  const { data: observationsData, isLoading: isLoadingObservations, refetch: refetchObservations, isFetching: isRefetchingObservations } = useFetchObservationsQuery(
    { patientId: patientId || "" },
    { 
      skip: !patientId,
      pollingInterval: 0, // Disable polling to avoid unnecessary requests
    }
  );

  // Debug logging for observations data
  React.useEffect(() => {
    if (observationsData) {
      console.log('Observations data updated:', observationsData.entry?.length || 0, 'observations');
    }
  }, [observationsData]);

  const [addObservation, { isLoading: isAddingObservation }] = useAddObservationMutation();
  const [addObservationsBatch, { isLoading: isBatchAdding }] = useAddObservationsBatchMutation();

  const handleModalClose = () => {
    if (!isLoadingObservations) {
      dispatch(setModal({ isOpen: false, type: "details" }));
    }
  };

  const handleAddVitalSign = (observationData: Observation) => {
    console.log('Adding vital sign:', observationData);
    
    // Immediately add to local state for instant UI feedback
    const newObservation = {
      ...observationData,
      id: `temp-${Date.now()}`,
    };
    setNewlyAddedObservations(prev => [...prev, newObservation]);
    
    addObservation(observationData)
      .unwrap()
      .then((result) => {
        console.log('Vital sign added successfully:', result);
        
        // Remove from local state since it's now in the server response
        setNewlyAddedObservations(prev => prev.filter(obs => obs.id !== newObservation.id));
        
        // Force an immediate refetch to ensure the UI updates
        setTimeout(() => {
          console.log('Refetching observations...');
          refetchObservations();
        }, 100);
        
        dispatch(
          setSnackbar({
            isOpen: true,
            severity: "success",
            message: "Vital sign added successfully",
          })
        );
        setShowAddModal(false);
      })
      .catch((error) => {
        console.error('Failed to add vital sign:', error);
        // Remove from local state on error
        setNewlyAddedObservations(prev => prev.filter(obs => obs.id !== newObservation.id));
        dispatch(
          setSnackbar({
            isOpen: true,
            severity: "error",
            message: "Failed to add vital sign",
          })
        );
      });
  };

  const getBloodPressureObservations = () => {
    const entries = observationsData?.entry ?? [];
    const serverObservations = entries
      .map(entry => entry.resource as Observation)
      .filter(obs => {
        const hasBpCode = obs.code?.coding?.some(coding => coding.code === BP.loincCode);
        const hasBpComponents = obs.component?.some(c =>
          c.code?.coding?.some(cd => cd.code === "8480-6" || cd.code === "8462-4")
        );
        return hasBpCode || hasBpComponents;
      });
    const localObservations = newlyAddedObservations.filter(obs => {
      const hasBpCode = obs.code?.coding?.some(coding => coding.code === BP.loincCode);
      const hasBpComponents = obs.component?.some(c =>
        c.code?.coding?.some(cd => cd.code === "8480-6" || cd.code === "8462-4")
      );
      return hasBpCode || hasBpComponents;
    });
    const all = [...serverObservations, ...localObservations];
    return all.sort((a, b) =>
      new Date(b.effectiveDateTime || "").getTime() -
      new Date(a.effectiveDateTime || "").getTime()
    );
  };

  const formatObservationValue = (observation: Observation) => {
    // Handle blood pressure panel components if present
    if (observation.component && observation.component.length > 0) {
      const systolic = observation.component.find(c =>
        c.code?.coding?.some(cd => cd.code === "8480-6")
      )?.valueQuantity?.value;
      const diastolic = observation.component.find(c =>
        c.code?.coding?.some(cd => cd.code === "8462-4")
      )?.valueQuantity?.value;
      const unit =
        observation.component.find(c =>
          c.code?.coding?.some(cd => cd.code === "8480-6")
        )?.valueQuantity?.unit || "mmHg";
      if (systolic !== undefined && diastolic !== undefined) {
        return `${systolic}/${diastolic} ${unit}`;
      }
      // Fallback if only one component present
      if (systolic !== undefined) return `${systolic} ${unit}`;
      if (diastolic !== undefined) return `${diastolic} ${unit}`;
    }
    if (observation.valueQuantity) {
      return `${observation.valueQuantity.value} ${observation.valueQuantity.unit || ""}`;
    }
    if (observation.valueCodeableConcept) {
      return observation.valueCodeableConcept.text || observation.valueCodeableConcept.coding?.[0]?.display || "N/A";
    }
    if (observation.valueString) {
      return observation.valueString;
    }
    return "N/A";
  };

  const isNewlyAdded = (observation: Observation) => {
    if (!observation.effectiveDateTime) return false;
    const observationTime = dayjs(observation.effectiveDateTime);
    const fiveMinutesAgo = dayjs().subtract(5, 'minute');
    return observationTime.isAfter(fiveMinutesAgo);
  };

  // Blood pressure normal ranges
  const BP_NORMAL_RANGES = {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 },
  };

  const isBloodPressureOutOfRange = (observation: Observation): boolean => {
    if (!observation.component || observation.component.length === 0) return false;
    
    const systolic = observation.component.find(c =>
      c.code?.coding?.some(cd => cd.code === "8480-6")
    )?.valueQuantity?.value;
    
    const diastolic = observation.component.find(c =>
      c.code?.coding?.some(cd => cd.code === "8462-4")
    )?.valueQuantity?.value;

    if (systolic === undefined && diastolic === undefined) return false;

    const systolicOutOfRange = systolic !== undefined && 
      (systolic < BP_NORMAL_RANGES.systolic.min || systolic > BP_NORMAL_RANGES.systolic.max);
    
    const diastolicOutOfRange = diastolic !== undefined && 
      (diastolic < BP_NORMAL_RANGES.diastolic.min || diastolic > BP_NORMAL_RANGES.diastolic.max);

    return systolicOutOfRange || diastolicOutOfRange;
  };

  const renderTable = (observations: Observation[]) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date & Time</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {observations.length > 0 ? (
            observations.map((obs, index) => {
              const isOutOfRange = isBloodPressureOutOfRange(obs);
              const isNew = isNewlyAdded(obs);
              
              return (
                <TableRow 
                  key={index} 
                  sx={{
                    ...(isOutOfRange && { backgroundColor: 'rgba(244, 67, 54, 0.15)' }),
                    ...(isNew && !isOutOfRange && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }),
                  }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {obs.effectiveDateTime 
                        ? dayjs(obs.effectiveDateTime).format("YYYY-MM-DD HH:mm")
                        : "N/A"
                      }
                      {isNew && (
                        <Chip
                          label="NEW"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{ color: isOutOfRange ? 'error.main' : 'inherit' }}
                    >
                      {formatObservationValue(obs)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={obs.status || "unknown"}
                      color={
                        obs.status === "final" ? "success" :
                        obs.status === "preliminary" ? "warning" :
                        obs.status === "amended" ? "info" : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {obs.note?.[0]?.text || "N/A"}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary">
                  No blood pressure observations found
                </Typography>
              </TableCell>
            </TableRow>
            )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderGraph = (observations: Observation[]) => {
    if (observations.length === 0) {
      return (
        <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No data available for visualization
          </Typography>
        </Box>
      );
    }

    // Sort observations by date (newest first, consistent with table)
    const sortedObservations = [...observations].sort((a, b) => 
      new Date(b.effectiveDateTime || "").getTime() - new Date(a.effectiveDateTime || "").getTime()
    );

    // For graph display, we want chronological order (oldest to newest)
    const chronologicalObservations = [...sortedObservations].reverse();

    // Filter to only include observations with both systolic and diastolic values
    // This prevents graph breaks from incomplete data
    const completeObservations = chronologicalObservations.filter(obs => {
      const systolic = obs.component?.find(c => c.code?.coding?.some(cd => cd.code === "8480-6"))?.valueQuantity?.value;
      const diastolic = obs.component?.find(c => c.code?.coding?.some(cd => cd.code === "8462-4"))?.valueQuantity?.value;
      return systolic !== undefined && systolic !== null && 
             diastolic !== undefined && diastolic !== null;
    });

    // If no complete observations, show message
    if (completeObservations.length === 0) {
      return (
        <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No complete blood pressure data available for visualization
          </Typography>
        </Box>
      );
    }

    // Prepare chart data
    const labels = completeObservations.map(obs => 
      dayjs(obs.effectiveDateTime).format("MMM DD")
    );

    const systolicData = completeObservations.map(obs => {
      const comp = obs.component?.find(c => c.code?.coding?.some(cd => cd.code === "8480-6"));
      return comp?.valueQuantity?.value ?? null;
    });
    const diastolicData = completeObservations.map(obs => {
      const comp = obs.component?.find(c => c.code?.coding?.some(cd => cd.code === "8462-4"));
      return comp?.valueQuantity?.value ?? null;
    });

    // Determine point colors based on whether BP is out of range
    const systolicPointColors = completeObservations.map((_obs, index) => {
      const systolic = systolicData[index];
      if (systolic === null || systolic === undefined) return 'rgba(128, 128, 128, 0.8)';
      const isOutOfRange = systolic < BP_NORMAL_RANGES.systolic.min || systolic > BP_NORMAL_RANGES.systolic.max;
      return isOutOfRange ? 'rgba(244, 67, 54, 0.9)' : 'rgba(75, 192, 192, 0.8)';
    });

    const diastolicPointColors = completeObservations.map((_obs, index) => {
      const diastolic = diastolicData[index];
      if (diastolic === null || diastolic === undefined) return 'rgba(128, 128, 128, 0.8)';
      const isOutOfRange = diastolic < BP_NORMAL_RANGES.diastolic.min || diastolic > BP_NORMAL_RANGES.diastolic.max;
      return isOutOfRange ? 'rgba(244, 67, 54, 0.9)' : 'rgba(255, 159, 64, 0.8)';
    });

    const systolicBorderColors = completeObservations.map((_obs, index) => {
      const systolic = systolicData[index];
      if (systolic === null || systolic === undefined) return 'rgb(128, 128, 128)';
      const isOutOfRange = systolic < BP_NORMAL_RANGES.systolic.min || systolic > BP_NORMAL_RANGES.systolic.max;
      return isOutOfRange ? 'rgb(244, 67, 54)' : 'rgb(75, 192, 192)';
    });

    const diastolicBorderColors = completeObservations.map((_obs, index) => {
      const diastolic = diastolicData[index];
      if (diastolic === null || diastolic === undefined) return 'rgb(128, 128, 128)';
      const isOutOfRange = diastolic < BP_NORMAL_RANGES.diastolic.min || diastolic > BP_NORMAL_RANGES.diastolic.max;
      return isOutOfRange ? 'rgb(244, 67, 54)' : 'rgb(255, 159, 64)';
    });

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Systolic (mmHg)',
          data: systolicData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: systolicPointColors,
          pointBorderColor: systolicBorderColors,
          pointBorderWidth: 2,
          spanGaps: false,
        },
        {
          label: 'Diastolic (mmHg)',
          data: diastolicData,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: diastolicPointColors,
          pointBorderColor: diastolicBorderColors,
          pointBorderWidth: 2,
          spanGaps: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Blood Pressure Over Time`,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y;
              if (value === undefined || value === null) return `BP: N/A`;
              
              const isSystolic = context.dataset.label?.includes('Systolic');
              const range = isSystolic 
                ? BP_NORMAL_RANGES.systolic 
                : BP_NORMAL_RANGES.diastolic;
              
              const isOutOfRange = value < range.min || value > range.max;
              const status = isOutOfRange ? '⚠️ OUT OF RANGE' : '✅ NORMAL';
              
              return `${context.dataset.label}: ${value} mmHg (${status})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'mmHg',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
    };

    return (
      <Box sx={{ height: 400, width: '100%' }}>
        <Line data={chartData} options={options} />
        
        {/* Normal range indicator */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(75, 192, 192, 0.1)', borderRadius: 1, border: '1px solid rgba(75, 192, 192, 0.3)' }}>
          <Typography variant="caption" color="text.secondary">
            Normal Range: Systolic {BP_NORMAL_RANGES.systolic.min}-{BP_NORMAL_RANGES.systolic.max} mmHg, 
            Diastolic {BP_NORMAL_RANGES.diastolic.min}-{BP_NORMAL_RANGES.diastolic.max} mmHg
          </Typography>
        </Box>
        
        {/* Legend for normal vs out of range values */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'rgba(75, 192, 192, 0.8)' }} />
            <Typography variant="caption">Normal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'rgba(244, 67, 54, 0.9)' }} />
            <Typography variant="caption">Out of Range</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const generateDummyBloodPressureData = async () => {
    if (!patientId) return;
    const now = dayjs();
    // Generate 10 readings over past 10 days
    const observations: Observation[] = Array.from({ length: 10 }).map((_, idx) => {
      const date = now.subtract(10 - idx, 'day').hour(8 + Math.floor(Math.random() * 10)).minute(Math.floor(Math.random() * 60)).second(Math.floor(Math.random() * 60));
      const systolic = Math.floor(Math.random() * (140 - 100 + 1)) + 100; // 100-140
      const diastolic = Math.floor(Math.random() * (90 - 60 + 1)) + 60;   // 60-90
      const obs: Observation = {
        resourceType: "Observation",
        status: "final",
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
              code: BP.loincCode,
              display: BP.name,
            },
          ],
          text: BP.name,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        effectiveDateTime: date.format("YYYY-MM-DDTHH:mm:ss"),
        component: [
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
              text: "Systolic blood pressure",
            },
            valueQuantity: { value: systolic, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
          {
            code: {
              coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
              text: "Diastolic blood pressure",
            },
            valueQuantity: { value: diastolic, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
          },
        ],
        note: [{ text: `Dummy BP at ${date.format("YYYY-MM-DD HH:mm")}` }],
      };
      return obs;
    });

    try {
      // Optimistically add local
      const temp = observations.map(o => ({ ...o, id: `temp-dummy-${o.effectiveDateTime}` }));
      setNewlyAddedObservations(prev => [...prev, ...temp]);
      // Try batch first
      await addObservationsBatch(observations).unwrap();
      // Clear temps after successful refetch
      setNewlyAddedObservations(prev => prev.filter(obs => !(obs.id && String(obs.id).startsWith('temp-dummy-'))));
      setTimeout(() => refetchObservations(), 100);
      dispatch(setSnackbar({ isOpen: true, severity: "success", message: "Added 10 dummy BP records" }));
    } catch (error) {
      console.error("Batch add failed, falling back to individual POSTs:", error);
      try {
        // Fallback to individual POSTs
        for (const obs of observations) {
          // eslint-disable-next-line no-await-in-loop
          await addObservation(obs).unwrap();
        }
        // Clear temps after successful fallback
        setNewlyAddedObservations(prev => prev.filter(obs => !(obs.id && String(obs.id).startsWith('temp-dummy-'))));
        setTimeout(() => refetchObservations(), 100);
        dispatch(setSnackbar({ isOpen: true, severity: "success", message: "Added 10 dummy BP records (fallback)" }));
      } catch (indErr) {
        // Revert local on total failure
        setNewlyAddedObservations(prev => prev.filter(obs => !(obs.id && String(obs.id).startsWith('temp-dummy-'))));
        dispatch(setSnackbar({ isOpen: true, severity: "error", message: "Failed to add dummy BP records" }));
      }
    }
  };

  if (!patient) return null;

  const patientName = patient.name?.[0]?.text || patient.name?.[0]?.given?.join(" ") || "Unknown Patient";

  return (
    <>
      <Dialog open={modalData.isOpen} onClose={handleModalClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Patient Details</Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAddModal(true)}
              disabled={isAddingObservation}
              startIcon={isAddingObservation ? <CircularProgress size={16} /> : null}
            >
              {isAddingObservation ? 'Adding...' : 'Add Blood Pressure'}
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack gap={3}>
            {/* Patient Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" fontWeight="bold">{patientName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" textTransform="capitalize">{patient.gender || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">
                      {patient.birthDate ? dayjs(patient.birthDate).format("YYYY-MM-DD") : "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Contact</Typography>
                    <Typography variant="body1">{patient.telecom?.[0]?.value || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1">
                      {patient.address?.[0] ? (
                        [
                          patient.address[0].text,
                          patient.address[0].district,
                          patient.address[0].state,
                          patient.address[0].postalCode
                        ].filter(Boolean).join(", ") || "N/A"
                      ) : (
                        "N/A"
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Divider />

            {/* Blood Pressure Section */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Blood Pressure</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={viewMode === "table" ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setViewMode("table")}
                  >
                    Table
                  </Button>
                  <Button
                    variant={viewMode === "graph" ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setViewMode("graph")}
                  >
                    Graph
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={generateDummyBloodPressureData}
                    disabled={isBatchAdding}
                    startIcon={isBatchAdding ? <CircularProgress size={16} /> : null}
                  >
                    {isBatchAdding ? 'Adding...' : 'Add 10 Dummy Records'}
                  </Button>
                </Stack>
              </Stack>
              {isLoadingObservations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography>Loading observations...</Typography>
                </Box>
              ) : (
                <>
                  {isRefetchingObservations && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Updating...
                      </Typography>
                    </Box>
                  )}
                  {viewMode === "table" 
                    ? renderTable(getBloodPressureObservations())
                    : renderGraph(getBloodPressureObservations())
                  }
                </>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <AddVitalSignModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVitalSign}
        patientId={patientId || ""}
        isLoading={isAddingObservation}
      />
    </>
  );
};

export default PatientDetailsModal; 