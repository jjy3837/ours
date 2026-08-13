import StepShell from './StepShell.jsx';
import { CATEGORIES, CATEGORY_EMOJI } from '../constants.js';

export default function Step2Category({ onSelect }) {
  return (
    <StepShell
      step={2}
      eyebrow="한마디, 잘 전달했어요"
      title="이번엔 어떤 이야기를 받아볼까요?"
      description="지금 당신의 마음에 가장 가까운 주제를 골라주세요."
    >
      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className="button button--category"
            onClick={() => onSelect(category)}
          >
            <span className="button--category__emoji" aria-hidden="true">
              {CATEGORY_EMOJI[category]}
            </span>
            {category}
          </button>
        ))}
      </div>
    </StepShell>
  );
}
