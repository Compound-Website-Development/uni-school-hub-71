import { useEffect, useState } from "react";
import { resolveStudentPhoto } from "@/lib/studentPhotos";

interface Props {
  photoRef?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/** Renders a student passport photo from a storage path using a fresh signed URL. */
export const StudentPhoto = ({ photoRef, alt, className = "w-full h-full object-cover", fallback = null }: Props) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveStudentPhoto(photoRef).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [photoRef]);

  if (!url) return <>{fallback}</>;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
};

export default StudentPhoto;
