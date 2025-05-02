import { configureStore } from "@reduxjs/toolkit";
import { patientApi } from "./patient/patientApi";
import patientReducer from "./patient/patientSlice";
export const store = configureStore({
  reducer: {
    [patientApi.reducerPath]: patientApi.reducer,
    patient: patientReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(patientApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
