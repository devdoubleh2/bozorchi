import { useState } from "react";
import { usePOSStore } from "@/context/POSStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pause } from "lucide-react";

interface PauseSessionButtonProps {
  disabled?: boolean;
}

export function PauseSessionButton({ disabled = false }: PauseSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const { pauseSession, getCartItemCount } = usePOSStore();

  const cartItemCount = getCartItemCount();

  if (cartItemCount === 0) {
    return null;
  }

  const handlePauseSession = () => {
    if (!customerName.trim()) {
      return;
    }

    pauseSession(Date.now().toString(), customerName.trim());
    setCustomerName("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || cartItemCount === 0}
          title="Pause current session and serve another customer"
        >
          <Pause className="h-4 w-4" />
          Pause & Switch
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Pause Customer Session</DialogTitle>
          <DialogDescription>
            Save this customer's cart ({cartItemCount} items) and serve another
            customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              placeholder="Enter customer name or identifier"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customerName.trim()) {
                  handlePauseSession();
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePauseSession}
            disabled={!customerName.trim()}
          >
            Pause Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
