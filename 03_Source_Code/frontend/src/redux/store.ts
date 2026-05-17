import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"

import authReducer from "./auth.slice";
import generalReducer from "./general.slice";
import sessionReducer from "./session.slice";
import questionReducer from "./question.slice";

const rootReducer = combineReducers({
    auth : authReducer,
    general: generalReducer,
    testSession: sessionReducer,
    questionsData : questionReducer,
})

const persistConfig = {
    key : "root",
    storage: storage,
    whitelist: ["testSession", "questionsData"],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
})

export default store; 
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;