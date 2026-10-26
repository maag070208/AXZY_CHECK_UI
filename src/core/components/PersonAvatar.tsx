import { ITImage } from "@axzydev/axzy_ui_system";
import { Blobatar } from "@blobatar/react";
import { useEffect, useState } from "react";

interface PersonAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  animate?: "hover";
}

/**
 * Avatar de una persona: usa su foto si existe y, si no o si falla la carga,
 * genera un Blobatar determinista con su nombre. El contenedor recorta en círculo.
 */
export const PersonAvatar = ({ name, photoUrl, size = 40, className = "", animate = "hover" }: PersonAvatarProps) => {
  const label = name?.trim() || "Usuario";
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
    if (!photoUrl || typeof window === "undefined" || typeof window.Image === "undefined") return;
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (active) setPhotoFailed(false);
    };
    image.onerror = () => {
      if (active) setPhotoFailed(true);
    };
    image.src = photoUrl;
    return () => {
      active = false;
    };
  }, [photoUrl]);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      style={{ width: size, height: size }}
      role={!photoUrl || photoFailed ? "img" : undefined}
      aria-label={!photoUrl || photoFailed ? label : undefined}
    >
      {photoUrl && !photoFailed ? (
        <ITImage src={photoUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        <Blobatar name={label} size={size} animate={animate} />
      )}
    </div>
  );
};
