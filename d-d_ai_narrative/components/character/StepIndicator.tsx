type StepStatus = 'completed' | 'active' | 'pending';

function getStepStatus(stepIndex: number, currentStep: number): StepStatus {
  if (stepIndex < currentStep) return 'completed';
  if (stepIndex === currentStep) return 'active';
  return 'pending';
}

interface StepIndicatorProps {
  steps: readonly string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, index) => {
        const status = getStepStatus(index, currentStep);
        const isLast = index === steps.length - 1;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                  ${status === 'completed' ? 'bg-green-600 text-white' : ''}
                  ${status === 'active' ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-black' : ''}
                  ${status === 'pending' ? 'bg-gray-700 text-gray-400 border border-gray-600' : ''}
                `}
              >
                {status === 'completed' ? '✓' : index + 1}
              </div>
              <p
                className={`
                  text-xs font-semibold transition-all
                  ${status === 'completed' ? 'text-green-500' : ''}
                  ${status === 'active' ? 'text-red-500' : ''}
                  ${status === 'pending' ? 'text-gray-500' : ''}
                `}
              >
                {label}
              </p>
            </div>

            {!isLast && (
              <div
                className={`
                  w-24 h-0.5 mx-2 mb-5 transition-all
                  ${index < currentStep ? 'bg-green-600' : 'bg-gray-700'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
