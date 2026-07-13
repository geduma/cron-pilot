interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'TIMEOUT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getStatusStyles()} ${sizeStyles[size]}`}
    >
      {status}
    </span>
  );
}
