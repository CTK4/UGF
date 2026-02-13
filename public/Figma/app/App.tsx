import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SaveProvider } from "./context/SaveProvider";

export default function App() {
  return (
    <SaveProvider>
      <RouterProvider router={router} />
    </SaveProvider>
  );
}