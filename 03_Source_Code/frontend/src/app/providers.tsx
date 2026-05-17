'use client';

import { Provider } from "react-redux";
import store from "@/redux/store";
import { persistor } from "@/redux/store"
import { PersistGate } from "redux-persist/integration/react";

export function ReduxProvider({children}: {children: React.ReactNode}) {
    return (
        <Provider store={store}>
            <PersistGate persistor={persistor} loading={null}>
                {children}
            </PersistGate>
        </Provider>
    )
}