export const levenshteinDistance = (str1: string, str2: string): number => {
  const rows = str2.length + 1;
  const cols = str1.length + 1;
  
  const dp: number[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0));

  for (let i = 0; i < cols; i++) {
    dp[0][i] = i;
  }

  for (let j = 0; j < rows; j++) {
    dp[j][0] = j;
  }

  for (let j = 1; j < rows; j++) {
    for (let i = 1; i < cols; i++) {
      const char1 = str1[i - 1];
      const char2 = str2[j - 1];

      if (char1 === char2) {
        dp[j][i] = dp[j - 1][i - 1];
      } else {
        dp[j][i] = Math.min(
          dp[j][i - 1] + 1,     
          dp[j - 1][i] + 1,     
          dp[j - 1][i - 1] + 1  
        );
      }
    }
  }

  return dp[str2.length][str1.length];
};

/**
 * Detect if user is spelling letter-by-letter instead of speaking words
 * e.g., "a k u m a k a n" instead of "aku makan"
 */
const isLetterByLetterSpelling = (spoken: string, expected: string): boolean => {
  const trimmedSpoken = spoken.trim();
  const trimmedExpected = expected.trim();
  
  // Split by spaces
  const spokenParts = trimmedSpoken.split(/\s+/);
  const expectedParts = trimmedExpected.split(/\s+/);
  
  // If spoken has significantly more "words" (parts) than expected, 
  // it might be letter-by-letter spelling
  // e.g., "aku makan" = 2 words, "a k u m a k a n" = 8 parts
  
  // Count single-character parts in spoken
  const singleCharCount = spokenParts.filter(part => part.length === 1).length;
  const totalParts = spokenParts.length;
  
  // If more than 50% of parts are single characters and there are many more parts than expected
  if (totalParts > 2 && singleCharCount / totalParts > 0.5) {
    // Check if joining letters matches the expected word
    const joinedSpoken = spokenParts.join('').toLowerCase();
    const joinedExpected = expectedParts.join('').toLowerCase();
    
    // If the joined letters closely match the expected word, it's spelling
    if (joinedSpoken === joinedExpected) {
      return true;
    }
    
    // Also check with some tolerance (in case of minor speech recognition errors)
    const distance = levenshteinDistance(joinedSpoken, joinedExpected);
    const maxLen = Math.max(joinedSpoken.length, joinedExpected.length);
    if (maxLen > 0 && distance / maxLen < 0.2) {
      return true;
    }
  }
  
  // Also detect patterns like "a-k-u" or very spaced out single letters
  // Check if most characters are followed by a space
  const letterSpacePattern = /^([a-zA-Z]\s+)+[a-zA-Z]?$/;
  if (letterSpacePattern.test(trimmedSpoken) && spokenParts.length > 3) {
    return true;
  }
  
  return false;
};

export const calculateAccuracy = (spoken: string, expected: string): number => {
  const normalize = (text: string): string => 
    text.toLowerCase().trim().replace(/[.,!?;:]+$/g, "").replace(/[^\p{L}]+/gu, "");

  // First, check if user is spelling letter-by-letter (before normalization removes spaces)
  if (isLetterByLetterSpelling(spoken, expected)) {
    // Penalize letter-by-letter spelling - return very low accuracy
    return 10; // Give minimal score to indicate wrong approach
  }

  const spokenNorm = normalize(spoken);
  const expectedNorm = normalize(expected);

  if (spokenNorm === expectedNorm) {
    return 100;
  }

  if (!spokenNorm || !expectedNorm) {
    return 0;
  }

  const distance = levenshteinDistance(spokenNorm, expectedNorm);
  const maxLength = Math.max(spokenNorm.length, expectedNorm.length);
  const accuracy = Math.round(
    ((maxLength - distance) / maxLength) * 100
  );

  return Math.max(0, accuracy);
};