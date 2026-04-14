// Mischt die Optionen einer Frage und gibt eine neue Frage mit gemischten Optionen zurück
export function shuffleQuestionOptions(question) {
  if (!question.options) return question;
  const indices = question.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...question,
    options: indices.map(i => question.options[i]),
    correct: indices.indexOf(question.correct),
  };
}
