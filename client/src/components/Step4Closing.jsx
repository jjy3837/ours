export default function Step4Closing({ onRestart }) {
  return (
    <section className="step4-container">
      <div className="step4-overlay">
        <p className="step4-quote">지금이 제일 캄캄한 밤이라면, 곧 아침이라는 뜻이에요.</p>
        <button type="button" className="button button--closing" onClick={onRestart}>
          처음으로
        </button>
      </div>
    </section>
  );
}
