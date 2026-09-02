interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded border border-l-2 border-l-impact-source border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
      {message}
    </div>
  );
}
