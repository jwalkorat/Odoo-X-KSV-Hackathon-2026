// Format currency to Indian Rupees (INR)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

// Format ISO string to readable date
export const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Retrieve tailwind CSS classes for status badges based on state
export const getStatusBadgeClass = (status) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'OPEN':
    case 'ACTIVE':
    case 'ISSUED':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
    case 'APPROVED':
    case 'PAID':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    case 'PENDING':
    case 'SUBMITTED':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    case 'REJECTED':
    case 'BLACKLISTED':
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-400 border border-red-500/30';
    case 'DRAFT':
    case 'CLOSED':
    case 'INACTIVE':
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
  }
};
