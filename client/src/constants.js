export const CATEGORIES = ['인간관계', '진로', '커리어', '경제적 사정', '기타'];

export const MIN_CONTENT_LENGTH = 10;
export const MAX_CONTENT_LENGTH = 500;

export const CATEGORY_EMOJI = {
  인간관계: '🤝',
  진로: '🧭',
  커리어: '💼',
  '경제적 사정': '🪙',
  기타: '🌤️',
};

/** Step 1에서 "무엇을 써야 할지" 막막하지 않도록 보여주는 카테고리별 예시. */
export const CATEGORY_EXAMPLES = {
  인간관계: [
    '모든 사람에게 좋은 사람일 필요는 없어요.',
    '잠시 거리를 두는 것도 관계를 지키는 방법이에요.',
  ],
  진로: [
    '남의 속도 말고 내가 가는 방향을 보세요.',
    '지금 고민하는 이 시간도 결국 길이 돼요.',
  ],
  커리어: [
    '오늘의 서툰 하루가 내일의 경력이 돼요.',
    '조금 돌아가더라도 쌓아온 것은 사라지지 않아요.',
  ],
  '경제적 사정': [
    '통장 잔고가 당신의 가치를 정하지는 않아요.',
    '지금의 부족함은 지나가는 계절 같은 거예요.',
  ],
  기타: [
    '오늘 하루를 버텨낸 것만으로 충분해요.',
    '괜찮지 않아도 괜찮아요.',
  ],
};

export function pickRandomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}
