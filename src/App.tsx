import { CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import Layout from "./components/Layout";
import { lightTheme } from "./config/theme";
import { store } from "./redux/store";

function App() {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Layout />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </>
  );
}

export default App;
