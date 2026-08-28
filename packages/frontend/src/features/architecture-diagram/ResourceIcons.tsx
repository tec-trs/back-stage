export function UrlIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ApplicationIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
      <circle cx="7" cy="6" r="1" fill="currentColor" />
      <circle cx="11" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

export function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 5v8c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="12" cy="16" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 8v8c0 1.66 3.58 3 8 3s8-1.34 8-3V8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="5.5" r="1" fill="currentColor" />
      <circle cx="16" cy="5.5" r="1" fill="currentColor" />
      <rect x="3" y="10" width="18" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="12.5" r="1" fill="currentColor" />
      <circle cx="16" cy="12.5" r="1" fill="currentColor" />
      <rect x="3" y="17" width="18" height="3" rx="1" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="18.5" r="1" fill="currentColor" />
      <circle cx="16" cy="18.5" r="1" fill="currentColor" />
    </svg>
  );
}

const iconMap = {
  url: UrlIcon,
  application: ApplicationIcon,
  service: ServiceIcon,
  database: DatabaseIcon,
  server: ServerIcon,
};

export function getIconComponent(resourceType: string) {
  return iconMap[resourceType as keyof typeof iconMap] || ServiceIcon;
}
