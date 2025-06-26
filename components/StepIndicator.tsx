
import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
  totalSteps: number;
  stepNames: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, stepNames }) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="flex items-center justify-center space-x-2 sm:space-x-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index; // 0-indexed
          let statusClasses = 'step-indicator w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm sm:text-base';
          let textClasses = 'text-xs sm:text-sm mt-1 text-center';
          let connectorClass = index < totalSteps - 1 ? "flex-auto border-t-2 transition-colors duration-500 ease-in-out" : "hidden";
          
          if (stepNumber < currentStep) {
            statusClasses += ' bg-green-500 text-white'; // Completed
            connectorClass += ' border-green-500';
          } else if (stepNumber === currentStep) {
            statusClasses += ' active ring-2 ring-offset-2 ring-blue-500 bg-white text-blue-600'; // Current
             connectorClass += ' border-gray-300';
          } else {
            statusClasses += ' bg-gray-300 text-gray-600'; // Upcoming
            connectorClass += ' border-gray-300';
          }

          return (
            <React.Fragment key={stepNames[stepNumber]}>
              <li className="relative flex flex-col items-center">
                <div className={statusClasses}>
                  {stepNumber < currentStep ? (
                     <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{stepNumber + 1}</span>
                  )}
                </div>
                <p className={textClasses + (stepNumber === currentStep ? ' text-blue-600 font-semibold' : ' text-gray-500')}>{stepNames[stepNumber]}</p>
              </li>
              {index < totalSteps - 1 && (
                 <li className={connectorClass} style={{minWidth: '20px'}}></li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;