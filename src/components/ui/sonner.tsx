import { Toaster as Sonner } from "sonner";
import { Check, AlertCircle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const chipBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  width: 34,
  height: 34,
  borderRadius: 9999,
  background: "#2E2E2E",
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: (
          <span style={chipBase}>
            <Check size={18} color="#fff" strokeWidth={2} />
          </span>
        ),
        error: (
          <span style={{ ...chipBase, background: "#CC0000" }}>
            <AlertCircle size={18} color="#fff" strokeWidth={2} />
          </span>
        ),
        info: (
          <span style={chipBase}>
            <Info size={18} color="#fff" strokeWidth={2} />
          </span>
        ),
        warning: (
          <span style={chipBase}>
            <AlertCircle size={18} color="#fff" strokeWidth={2} />
          </span>
        ),
      }}
      toastOptions={{
        style: {
          background: "#141414",
          color: "#FFFFFF",
          border: "none",
          boxShadow: "0 10px 28px rgba(20,20,20,0.28)",
          padding: "10px 18px 10px 10px",
          gap: 12,
          alignItems: "center",
          borderRadius: 999,
        },
        classNames: {
          toast:
            "group toast font-sans [&:has([data-description])]:rounded-[20px]! [&:has([data-button])]:rounded-[20px]!",
          title: "text-[14px]! font-semibold! text-white!",
          description: "text-[12px]! text-[#BDBDBD]!",
          actionButton:
            "bg-transparent! p-0! shadow-none! border-none! text-[13px]! font-semibold! text-white! underline underline-offset-[3px]!",
          cancelButton:
            "bg-transparent! p-0! shadow-none! border-none! text-[13px]! font-semibold! text-white!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
