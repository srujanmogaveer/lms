-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 007 FIX
-- Normalize Quiz Question Types
-- ============================================================

BEGIN;

-- 1. Drop the existing question type constraint
ALTER TABLE public.quiz_questions
DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;


-- 2. Normalize existing question types
UPDATE public.quiz_questions
SET question_type = 'Single Answer'
WHERE TRIM(question_type) IN (
    'Single Answer',
    'Multiple Choice',
    'MCQ'
);

UPDATE public.quiz_questions
SET question_type = 'Multiple Answer'
WHERE TRIM(question_type) IN (
    'Multiple Answer',
    'Multiple Answers',
    'Multiple Select'
);

UPDATE public.quiz_questions
SET question_type = 'True or False'
WHERE TRIM(question_type) IN (
    'True or False',
    'True / False',
    'True/False'
);

UPDATE public.quiz_questions
SET question_type = 'Fill in the Blanks'
WHERE TRIM(question_type) IN (
    'Fill in the Blanks',
    'Fill in the Blank'
);


-- 3. Create a normalization function
CREATE OR REPLACE FUNCTION public.normalize_quiz_question_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    NEW.question_type :=
        regexp_replace(
            trim(NEW.question_type),
            '[[:space:]]+',
            ' ',
            'g'
        );

    -- Normalize old/frontend variations
    IF NEW.question_type IN ('Multiple Choice', 'MCQ') THEN
        NEW.question_type := 'Single Answer';

    ELSIF NEW.question_type IN (
        'Multiple Answers',
        'Multiple Select'
    ) THEN
        NEW.question_type := 'Multiple Answer';

    ELSIF NEW.question_type IN (
        'True / False',
        'True/False'
    ) THEN
        NEW.question_type := 'True or False';

    ELSIF NEW.question_type = 'Fill in the Blank' THEN
        NEW.question_type := 'Fill in the Blanks';

    END IF;

    RETURN NEW;
END;
$$;


-- 4. Create BEFORE INSERT/UPDATE trigger
DROP TRIGGER IF EXISTS
trigger_normalize_quiz_question_type
ON public.quiz_questions;

CREATE TRIGGER trigger_normalize_quiz_question_type
BEFORE INSERT OR UPDATE
ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.normalize_quiz_question_type();


-- 5. Create the final strict constraint
ALTER TABLE public.quiz_questions
ADD CONSTRAINT quiz_questions_question_type_check
CHECK (
    question_type IN (
        'Single Answer',
        'Multiple Answer',
        'Fill in the Blanks',
        'True or False'
    )
);


COMMIT;
