import { useCallback, useState } from 'react';
import Step1Write from './components/Step1Write.jsx';
import Step2Category from './components/Step2Category.jsx';
import Step3Result from './components/Step3Result.jsx';
import Step4Closing from './components/Step4Closing.jsx';
import { pickRandomCategory } from './constants.js';

export default function App() {
  const [step, setStep] = useState(1);
  const [writeCategory, setWriteCategory] = useState(pickRandomCategory);
  const [readCategory, setReadCategory] = useState(null);

  const restart = useCallback(() => {
    setWriteCategory(pickRandomCategory());
    setReadCategory(null);
    setStep(1);
  }, []);

  return (
    <div className={`app ${step === 4 ? 'app--closing' : ''}`}>
      {step === 1 && (
        <Step1Write category={writeCategory} onSubmitted={() => setStep(2)} />
      )}

      {step === 2 && (
        <Step2Category
          onSelect={(category) => {
            setReadCategory(category);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Step3Result category={readCategory} onNext={() => setStep(4)} />
      )}

      {step === 4 && <Step4Closing onRestart={restart} />}
    </div>
  );
}
