import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/auth.slice";
import toastReducer from "./toast/toast.slice";
import loaderReducer from "./loader/loader.slice";
import tableReducer from "./tables/tables.slice";
const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    loader: loaderReducer,
    table: tableReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
