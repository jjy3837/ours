export default function StepShell({ step, eyebrow, title, description, children }) {
  return (
    <main className="card" key={step}>
      <ol className="progress" aria-label={`전체 4단계 중 ${step}단계`}>
        {[1, 2, 3, 4].map((index) => (
          <li
            key={index}
            className={`progress__dot ${index <= step ? 'is-active' : ''}`}
            aria-current={index === step ? 'step' : undefined}
          />
        ))}
      </ol>

      {eyebrow && <p className="card__eyebrow">{eyebrow}</p>}
      <h1 className="card__title">{title}</h1>
      {description && <p className="card__description">{description}</p>}

      {children}
    </main>
  );
}
