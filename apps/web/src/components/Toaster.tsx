import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

const Toaster = () => {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      theme={theme === "dark" ? "dark" : "light"}
    />
  );
};

export default Toaster;
