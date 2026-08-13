import { useState } from 'react';
import StepShell from './StepShell.jsx';
import { createAdvice } from '../api.js';
import {
  CATEGORY_EMOJI,
  CATEGORY_EXAMPLES,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
} from '../constants.js';

export default function Step1Write({ category, onSubmitted }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedLength = content.trim().length;
  const canSubmit = trimmedLength >= MIN_CONTENT_LENGTH && !submitting;

  async function handleSubmit(event) {
    event.preventDefault();

    if (trimmedLength === 0) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (trimmedLength < MIN_CONTENT_LENGTH) {
      setError(`최소 ${MIN_CONTENT_LENGTH}자 이상 입력해주세요. (현재 ${trimmedLength}자)`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createAdvice({ category, content: content.trim() });
      onSubmitted();
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  return (
    <StepShell
      step={1}
      eyebrow="오늘 당신에게 도착한 주제"
      title="이런 고민을 가진 누군가에게, 한마디 남겨주세요"
      description="익명으로 저장되고, 이 주제를 고른 다른 누군가에게 전해집니다."
    >
      <p className="category-badge">
        <span aria-hidden="true">{CATEGORY_EMOJI[category]}</span> {category}
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="advice-content">
          조언 내용
        </label>
        <textarea
          id="advice-content"
          className="textarea"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (error) setError('');
          }}
          placeholder={`"${category}" 때문에 힘든 사람에게 건네고 싶은 말을 적어주세요.`}
          rows={6}
          maxLength={MAX_CONTENT_LENGTH}
          autoFocus
          aria-describedby="advice-examples"
        />

        <div className="examples" id="advice-examples">
          <p className="examples__label">이렇게 적어보세요</p>
          <ul className="examples__list">
            {CATEGORY_EXAMPLES[category].map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>

        <div className="form__meta">
          <span className={trimmedLength < MIN_CONTENT_LENGTH ? 'is-warning' : ''}>
            {trimmedLength} / 최소 {MIN_CONTENT_LENGTH}자
          </span>
          <span>
            {content.length} / {MAX_CONTENT_LENGTH}
          </span>
        </div>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button button--primary" disabled={!canSubmit}>
          {submitting ? '등록하는 중...' : '등록하기'}
        </button>
      </form>
    </StepShell>
  );
}
