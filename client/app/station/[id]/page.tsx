"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BACKEND_URL } from "@/constants/constans";

interface RJ {
  id: string;
  stationId: string;
  rjName: string;
  showName: string;
  showTiming: string;
}

interface AdvertisementSlot {
  id: string;
  stationId: string;
  rjId: string;
  slotTime: string;
  availabilityStatus: "AVAILABLE" | "BOOKED";
  price: number;
}

interface Station {
  id: string;
  stationName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  description: string | null;
  rjs: RJ[];
  advertisementSlots: AdvertisementSlot[];
}

export default function StationDetailsPage() {
  const { id } = useParams();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AdvertisementSlot | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
          throw new Error("Authentication token not found. Please login again.");
        }

        const response = await fetch(`${BACKEND_URL}/stations/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch station details: ${response.statusText}`);
        }

        const data = await response.json();
        setStation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStationDetails();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  async function handleBookingAndPayment(slot: AdvertisementSlot) {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Authentication token not found.");
      }

      // Fetch current user details
      const userRes = await fetch(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        throw new Error("Failed to fetch user details.");
      }
      const userData = await userRes.json();

      // Create a booking
      const requestBody = {
        userId: userData.id,
        stationId: station?.id,
        rjId: slot.rjId,
        slotId: slot.id,
      };

      const bookingRes = await fetch(`${BACKEND_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(errorData.message || "Booking failed.");
      }
      const bookingData = await bookingRes.json();
      setBookingId(bookingData.id);
      setSelectedSlot(slot);
      setPaymentDialogOpen(true); // Open payment dialog immediately after booking
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking failed.");
    }
  }

  async function handlePayment() {
    if (!bookingId || !selectedSlot) return;

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Authentication token not found.");
      }

      // Step 1: Initiate payment
      const initiateRes = await fetch(`${BACKEND_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: selectedSlot.price,
          transactionId: `txn_${Date.now()}`,
        }),
      });

      if (!initiateRes.ok) {
        const errorData = await initiateRes.json();
        throw new Error(errorData.message || "Failed to initiate payment.");
      }

      const paymentData = await initiateRes.json();
      const paymentId = paymentData.id;
      toast.success("Payment initiated successfully!");

      // Step 2: Ask for confirmation
      const confirmPayment = window.confirm("Are you sure you want to complete the payment?");
      if (!confirmPayment) {
        toast.error("Payment cancelled.");
        setPaymentDialogOpen(false);
        return;
      }

      // Step 3: Complete payment
      const completeRes = await fetch(
        `${BACKEND_URL}/payments/complete/${paymentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.message || "Failed to complete payment.");
      }

      toast.success("Payment completed successfully!");


      const stationRes = await fetch(`${BACKEND_URL}/stations/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!stationRes.ok) {
        throw new Error("Failed to fetch updated station details.");
      }

      const updatedStation = await stationRes.json();
      setStation(updatedStation);
      setPaymentDialogOpen(false);

    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred during payment."
      );
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!station) {
    return <ErrorState message="Station not found" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Please complete the payment for your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSlot && (
              <>
                <p>Booking ID: {bookingId}</p>
                <p>Amount to be paid: ₹{selectedSlot.price.toLocaleString()}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handlePayment}>Pay Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{station.stationName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Station Information</CardTitle>
            <CardDescription>Details about {station.stationName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{station.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>{station.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>{station.contactPhone}</span>
            </div>
            {station.description && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Description</h3>
                <p>{station.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Radio Jockeys</CardTitle>
            <CardDescription>RJs at this station</CardDescription>
          </CardHeader>
          <CardContent>
            {station.rjs.length > 0 ? (
              <div className="space-y-4">
                {station.rjs.map((rj) => (
                  <div key={rj.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{rj.rjName}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Show:</span> {rj.showName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{rj.showTiming}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No RJs available for this station.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Advertisement Slots</CardTitle>
          <CardDescription>Available and booked advertisement slots</CardDescription>
        </CardHeader>
        <CardContent>
          {station.advertisementSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {station.advertisementSlots.map((slot) => {
                const rj = station.rjs.find((r) => r.id === slot.rjId);
                return (
                  <Card key={slot.id} className="overflow-hidden">
                    <div
                      className={`p-1 text-center text-white ${slot.availabilityStatus === "AVAILABLE" ? "bg-green-500" : "bg-red-500"
                        }`}
                    >
                      {slot.availabilityStatus}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm">{formatDate(slot.slotTime)}</span>
                        </div>
                        {rj && (
                          <div className="flex items-center gap-2">
                            <Radio className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {rj.rjName} - {rj.showName}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="font-medium">
                            ₹{slot.price.toLocaleString()}
                          </Badge>
                          <Button
                            size="sm"
                            disabled={slot.availabilityStatus === "BOOKED"}
                            onClick={() => handleBookingAndPayment(slot)}
                          >
                            {slot.availabilityStatus === "AVAILABLE" ? "Book Now" : "Booked"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No advertisement slots available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96 mt-8" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  );
}