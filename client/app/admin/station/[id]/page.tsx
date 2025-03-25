"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
    price: number;
}

export default function Page() {
    const { id: stationId } = useParams();
    // State for RJ management
    const [rjs, setRjs] = useState<RJ[]>([]);
    const [loadingRjs, setLoadingRjs] = useState(false);
    const [errorRjs, setErrorRjs] = useState<string | null>(null);

    // Form state for creating/updating an RJ
    const [rjForm, setRjForm] = useState<{ rjName: string; showName: string; showTiming: string }>({
        rjName: '',
        showName: '',
        showTiming: '',
    });
    const [editingRjId, setEditingRjId] = useState<string | null>(null);

    // State for advertisement slot creation
    const [slotForm, setSlotForm] = useState<{ rjId: string; slotTime: string; price: string }>({
        rjId: '',
        slotTime: '',
        price: '',
    });
    const [slotDialogOpen, setSlotDialogOpen] = useState(false);

    // Dialog state for RJ selection (for slot creation)
    const [selectRjDialogOpen, setSelectRjDialogOpen] = useState(false);

    // --- Fetch all RJs ---
    const fetchRJs = async () => {
        setLoadingRjs(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:5000/rjs', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch RJs');
            const data = await res.json();
            setRjs(data);
            setErrorRjs(null);
        } catch (error) {
            setErrorRjs(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoadingRjs(false);
        }
    };

    useEffect(() => {
        fetchRJs();
    }, []);

    // --- Create / Update RJ ---
    const handleCreateOrUpdateRJ = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const url = editingRjId ? `http://localhost:5000/rjs/${editingRjId}` : 'http://localhost:5000/rjs';
            const method = editingRjId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    stationId,
                    rjName: rjForm.rjName,
                    showName: rjForm.showName,
                    showTiming: rjForm.showTiming,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Operation failed');
            }
            toast.success(editingRjId ? 'RJ updated successfully!' : 'RJ created successfully!');
            setRjForm({ rjName: '', showName: '', showTiming: '' });
            setEditingRjId(null);
            fetchRJs();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        }
    };

    // --- Delete RJ ---
    const handleDeleteRJ = async (rjId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:5000/rjs/${rjId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete RJ');
            }
            toast.success('RJ deleted successfully!');
            fetchRJs();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete RJ');
        }
    };

    // --- Advertisement Slot Creation ---
    // Assume slotTimeValue is obtained from the input (e.g., "2025-03-13T04:14")
    const formatSlotTime = (value: string) => {
        // If value doesn't contain seconds, append ":00"
        return value.length === 16 ? `${value}:00` : value;
    };

    const handleCreateSlot = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("Authentication token not found.");

            const formattedSlotTime = formatSlotTime(slotForm.slotTime);

            const res = await fetch("http://localhost:5000/slots", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    stationId,
                    rjId: slotForm.rjId,
                    slotTime: formattedSlotTime,
                    price: Number(slotForm.price),
                }),
            });

            if (res.ok) {
                setSlotDialogOpen(false)
                return;
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create advertisement slot");
        }
    };


    return (
        <div className="container mx-auto p-8 space-y-10">
            <h1 className="text-4xl font-bold mb-4">Manage Radio Jockeys & Advertisement Slots</h1>

            {/* Section: RJ CRUD */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Radio Jockeys</h2>

                {/* RJ Form (Create/Update) */}
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle>{editingRjId ? "Update RJ" : "Create New RJ"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">RJ Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border rounded-md p-2"
                                value={rjForm.rjName}
                                onChange={(e) => setRjForm({ ...rjForm, rjName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Show Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border rounded-md p-2"
                                value={rjForm.showName}
                                onChange={(e) => setRjForm({ ...rjForm, showName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Show Timing</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border rounded-md p-2"
                                placeholder="e.g., 10:00 AM - 12:00 PM"
                                value={rjForm.showTiming}
                                onChange={(e) => setRjForm({ ...rjForm, showTiming: e.target.value })}
                            />
                        </div>
                    </CardContent>
                    <div className="p-4 flex space-x-2">
                        <Button onClick={handleCreateOrUpdateRJ}>
                            {editingRjId ? "Update RJ" : "Create RJ"}
                        </Button>
                        {editingRjId && (
                            <Button variant="outline" onClick={() => { setEditingRjId(null); setRjForm({ rjName: '', showName: '', showTiming: '' }); }}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </Card>

                {/* List of RJs */}
                <div>
                    {loadingRjs ? (
                        <p>Loading RJs...</p>
                    ) : errorRjs ? (
                        <p className="text-red-500">{errorRjs}</p>
                    ) : (
                        <div className="space-y-4">
                            {rjs.map((rj) => (
                                <Card key={rj.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <CardTitle>{rj.rjName}</CardTitle>
                                        <CardDescription>{rj.showName} - {rj.showTiming}</CardDescription>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => { setEditingRjId(rj.id); setRjForm({ rjName: rj.rjName, showName: rj.showName, showTiming: rj.showTiming }); }}>
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteRJ(rj.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Advertisement Slots */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Advertisement Slots</h2>
                <Button onClick={() => setSlotDialogOpen(true)}>Create Advertisement Slot</Button>
            </div>

            {/* Dialog: Create Advertisement Slot */}
            <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Advertisement Slot</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create an advertisement slot.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* RJ selection field via dialog */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select RJ</label>
                            <div className="mt-1 flex">
                                <input
                                    type="text"
                                    readOnly
                                    value={slotForm.rjId ? (rjs.find(r => r.id === slotForm.rjId)?.rjName || '') : ''}
                                    placeholder="Select an RJ"
                                    className="block w-full border rounded-l-md p-2 cursor-not-allowed"
                                />
                                <Button onClick={() => setSelectRjDialogOpen(true)} className="rounded-l-none">
                                    Select
                                </Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slot Time</label>
                            <input
                                type="datetime-local"
                                className="mt-1 block w-full border rounded-md p-2"
                                value={slotForm.slotTime}
                                onChange={(e) => setSlotForm({ ...slotForm, slotTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input
                                type="number"
                                className="mt-1 block w-full border rounded-md p-2"
                                value={slotForm.price}
                                onChange={(e) => setSlotForm({ ...slotForm, price: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateSlot}>Create Slot</Button>
                        <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Select RJ for Advertisement Slot */}
            <Dialog open={selectRjDialogOpen} onOpenChange={setSelectRjDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select an RJ</DialogTitle>
                        <DialogDescription>
                            Choose an RJ from the list below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                        {rjs.map((rj) => (
                            <Card key={rj.id} className="p-2 cursor-pointer" onClick={() => { setSlotForm({ ...slotForm, rjId: rj.id }); setSelectRjDialogOpen(false); }}>
                                <CardTitle>{rj.rjName}</CardTitle>
                                <CardDescription>{rj.showName} - {rj.showTiming}</CardDescription>
                            </Card>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectRjDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
