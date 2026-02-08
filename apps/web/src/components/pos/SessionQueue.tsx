import { usePOSStore } from "@/context/POSStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Clock, Users, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SessionQueue() {
  const {
    pausedSessions,
    activeCustomerId,
    switchSession,
    removeSession,
    getSessionCount,
  } = usePOSStore();

  const sessionIds = Object.keys(pausedSessions);
  const sessionCount = getSessionCount();

  if (sessionCount === 0) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Pending customer sessions"
        >
          <Users className="h-4 w-4" />
          Queue
          <Badge variant="secondary" className="ml-1">
            {sessionCount}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Customer Queue ({sessionCount})</SheetTitle>
          <SheetDescription>
            Pause current customer and resume a paused one
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 mt-6">
          {sessionIds.map((customerId) => {
            const session = pausedSessions[customerId];
            const isActive = customerId === activeCustomerId;
            const itemCount = session.cart.length;
            const cartTotal = session.cart.reduce(
              (total, item) =>
                total +
                item.product_variation.selling_price * item.cart_quantity,
              0
            );

            return (
              <div
                key={customerId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {session.customerName}
                    </h3>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(cartTotal)}{" "}
                      UZS
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(session.pausedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>

                <div className="flex gap-2 ml-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => switchSession(customerId)}
                      className="text-xs"
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSession(customerId)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
