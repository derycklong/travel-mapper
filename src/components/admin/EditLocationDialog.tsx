"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Location } from "@/lib/types";

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onSave: (data: { name: string; address: string; latitude: number; longitude: number }) => void;
}

export function EditLocationDialog({
  open,
  onOpenChange,
  location,
  onSave,
}: EditLocationDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordError, setCoordError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(location?.name ?? "");
      setAddress(location?.address ?? "");
      setLatitude(location?.latitude?.toString() ?? "");
      setLongitude(location?.longitude?.toString() ?? "");
    }
  }, [location, open]);

  const isEditing = !!location?.id;
  const canSave = name.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    if ((latitude !== "" && isNaN(parseFloat(latitude))) || (longitude !== "" && isNaN(parseFloat(longitude)))) {
      setCoordError("Invalid coordinates");
      return;
    }
    setCoordError(null);

    onSave({
      name: name.trim(),
      address: address.trim(),
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
    });
  };

  const inputStyle: React.CSSProperties = {
    borderColor: "var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-text)",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Edit Location" : "Add Location"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label htmlFor="location-name" className="text-sm font-medium">Name</label>
              <input
                id="location-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 px-3 rounded-lg border text-sm"
                style={inputStyle}
                placeholder="Location name"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="location-address" className="text-sm font-medium">Address</label>
              <input
                id="location-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-9 px-3 rounded-lg border text-sm"
                style={inputStyle}
                placeholder="Address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="location-latitude" className="text-sm font-medium">Latitude</label>
                <input
                  id="location-latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => { setLatitude(e.target.value); setCoordError(null); }}
                  className="h-9 px-3 rounded-lg border text-sm w-full"
                  style={inputStyle}
                  placeholder="35.6762"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="location-longitude" className="text-sm font-medium">Longitude</label>
                <input
                  id="location-longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => { setLongitude(e.target.value); setCoordError(null); }}
                  className="h-9 px-3 rounded-lg border text-sm w-full"
                  style={inputStyle}
                  placeholder="139.6503"
                />
              </div>
            </div>

            {coordError && (
              <p className="text-red-500 text-xs">{coordError}</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!canSave}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditing
                    ? "bg-[#4285F4] text-white hover:bg-[#3367d6]"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                }`}
              >
                {isEditing ? "Save Changes" : "Add Location"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
