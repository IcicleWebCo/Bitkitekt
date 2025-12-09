import { CheckCircle, AlertCircle } from 'lucide-react';

interface EmailConfirmationProps {
  type: 'confirmed' | 'error';
  message?: string;
  onContinue: () => void;
}

export function EmailConfirmation({ type, message, onContinue }: EmailConfirmationProps) {
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
      <div className="text-center space-y-4">
        {type === 'confirmed' ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Email Confirmed!</h2>
            <p className="text-slate-300">
              Your email has been successfully verified. You can now access your account.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Confirmation Failed</h2>
            <p className="text-slate-300">
              {message || 'There was an error confirming your email. The link may have expired.'}
            </p>
          </>
        )}
        <button
          onClick={onContinue}
          className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
