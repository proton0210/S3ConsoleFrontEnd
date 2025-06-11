import { Suspense } from "react";
import SuccessContent from "./success-content";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-8"></div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}