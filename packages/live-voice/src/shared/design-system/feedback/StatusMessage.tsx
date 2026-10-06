import React from 'react';
export function StatusMessage({ children }: React.PropsWithChildren) {
  return <p role="status">{children}</p>;
}
