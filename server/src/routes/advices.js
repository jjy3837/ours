import { Router } from 'express';
import {
  CATEGORIES,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  isValidCategory,
} from '../config.js';
import {
  countAllCategories,
  countByCategory,
  createAdvice,
  findRandomByCategory,
} from '../advicesRepository.js';

export const advicesRouter = Router();

/** Express 4는 async 핸들러의 rejection을 자동으로 잡지 않아 직접 넘겨준다. */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const invalidCategoryResponse = (res) =>
  res.status(400).json({
    error: 'INVALID_CATEGORY',
    message: `category는 다음 중 하나여야 합니다: ${CATEGORIES.join(', ')}`,
  });

advicesRouter.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

advicesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { category, content } = req.body ?? {};

    if (!isValidCategory(category)) {
      return invalidCategoryResponse(res);
    }

    if (typeof content !== 'string') {
      return res.status(400).json({
        error: 'INVALID_CONTENT',
        message: 'content는 문자열이어야 합니다.',
      });
    }

    const trimmed = content.trim();

    if (trimmed.length < MIN_CONTENT_LENGTH) {
      return res.status(400).json({
        error: 'CONTENT_TOO_SHORT',
        message: `내용은 최소 ${MIN_CONTENT_LENGTH}자 이상 입력해주세요.`,
      });
    }

    if (trimmed.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({
        error: 'CONTENT_TOO_LONG',
        message: `내용은 최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있어요.`,
      });
    }

    res.status(201).json({ advice: await createAdvice(category, trimmed) });
  })
);

advicesRouter.get(
  '/random',
  asyncHandler(async (req, res) => {
    const { category, exclude } = req.query;

    if (!isValidCategory(category)) {
      return invalidCategoryResponse(res);
    }

    const excludeId = Number.isInteger(Number(exclude)) ? Number(exclude) : null;

    // 글이 없는 것은 오류가 아니라 정상 상태이므로 200 + null 로 응답한다.
    res.json({ advice: await findRandomByCategory(category, excludeId) });
  })
);

advicesRouter.get(
  '/count',
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    if (category === undefined) {
      return res.json({ counts: await countAllCategories() });
    }

    if (!isValidCategory(category)) {
      return invalidCategoryResponse(res);
    }

    res.json({ category, count: await countByCategory(category) });
  })
);
