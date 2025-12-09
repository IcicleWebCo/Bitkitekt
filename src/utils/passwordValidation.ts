export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length === 0) {
    return {
      score: 0,
      label: 'Enter a password',
      color: 'text-slate-400',
      suggestions: [],
    };
  }

  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include at least one special character');
  }

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [
    'text-red-400',
    'text-orange-400',
    'text-yellow-400',
    'text-lime-400',
    'text-green-400',
    'text-emerald-400',
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
    suggestions,
  };
}

export function isPasswordValid(password: string): boolean {
  return password.length >= 8;
}
