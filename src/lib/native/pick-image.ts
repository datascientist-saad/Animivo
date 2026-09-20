"use client";

import { Camera as CameraIcon, ImageIcon } from "lucide-react";
import { isNativeRuntime } from "@/lib/native/platform";

export async function dataUrlToFile(dataUrl: string, filename = "photo.jpg"): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  return new File([blob], filename, { type });
}

export async function pickImageFromNative(kind: "prompt" | "camera" | "photos" = "prompt"): Promise<File | null> {
  if (!isNativeRuntime()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const source =
    kind === "camera" ? CameraSource.Camera : kind === "photos" ? CameraSource.Photos : CameraSource.Prompt;
  const photo = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.DataUrl,
    source,
    saveToGallery: false,
    promptLabelHeader: "Pet photo",
    promptLabelPhoto: "Choose from photos",
    promptLabelPicture: "Take photo",
    promptLabelCancel: "Cancel",
  });
  if (!photo.dataUrl) return null;
  return dataUrlToFile(photo.dataUrl, `pet-photo.${photo.format || "jpg"}`);
}

export const nativePhotoActions = [
  { id: "camera" as const, label: "Take photo", icon: CameraIcon },
  { id: "photos" as const, label: "Choose from photos", icon: ImageIcon },
];
