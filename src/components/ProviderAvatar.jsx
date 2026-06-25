import React, { useState } from "react";

export default function ProviderAvatar({
  imageUrl,
  initials,
  className = "provider-avatar",
  alt = "Provider",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`${className} provider-avatar-shell`}>
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt={alt} onError={() => setImageFailed(true)} />
      ) : (
        initials
      )}
    </div>
  );
}
