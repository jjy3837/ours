import { useCallback, useEffect, useState } from 'react';
import StepShell from './StepShell.jsx';
import { fetchRandomAdvice } from '../api.js';
import { CATEGORY_EMOJI } from '../constants.js';

export default function Step3Result({ category, onNext }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (excludeId) => {
      setLoading(true);
      setError('');

      try {
        setAdvice(await fetchRandomAdvice({ category, excludeId }));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  useEffect(() => {
    load(null);
  }, [load]);

  return (
    <StepShell step={3} eyebrow={`${CATEGORY_EMOJI[category]} ${category}`} title="누군가 당신에게 남긴 한마디">
      <div className="quote-box">
        {loading && <p className="quote-box__placeholder">한마디를 고르는 중...</p>}

        {!loading && error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && !advice && (
          <p className="quote-box__placeholder">
            아직 등록된 글이 없어요.
            <span className="quote-box__sub">당신의 한마디가 이 자리의 첫 번째 글이 될 거예요.</span>
          </p>
        )}

        {!loading && !error && advice && <blockquote className="quote">{advice.content}</blockquote>}
      </div>

      <div className="button-row">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => load(advice?.id ?? null)}
          disabled={loading}
        >
          다른 글 보기
        </button>
        <button type="button" className="button button--primary" onClick={onNext}>
          다음으로
        </button>
      </div>
    </StepShell>
  );
}
