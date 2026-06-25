const STORAGE_KEY = "simpleVocabularyAppWords";

const wordForm = document.getElementById("wordForm");
const editingWordIdInput = document.getElementById("editingWordId");
const wordInput = document.getElementById("wordInput");
const meaningInput = document.getElementById("meaningInput");
const partOfSpeechInput = document.getElementById("partOfSpeechInput");
const exampleInput = document.getElementById("exampleInput");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");
const resetFormButton = document.getElementById("resetFormButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const totalCount = document.getElementById("totalCount");
const learnedCount = document.getElementById("learnedCount");
const notLearnedCount = document.getElementById("notLearnedCount");
const visibleCount = document.getElementById("visibleCount");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const wordList = document.getElementById("wordList");
const emptyMessage = document.getElementById("emptyMessage");

const quizMode = document.getElementById("quizMode");
const startQuizButton = document.getElementById("startQuizButton");
const quizQuestion = document.getElementById("quizQuestion");
const quizSubInfo = document.getElementById("quizSubInfo");
const answerInput = document.getElementById("answerInput");
const checkAnswerButton = document.getElementById("checkAnswerButton");
const quizResult = document.getElementById("quizResult");

let words = [];
let currentQuizWord = null;
let currentQuizMode = "";

loadWords();
renderApp();

wordForm.addEventListener("submit", handleFormSubmit);
resetFormButton.addEventListener("click", resetForm);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderWordList);
statusFilter.addEventListener("change", renderWordList);
startQuizButton.addEventListener("click", startQuiz);
checkAnswerButton.addEventListener("click", checkAnswer);

answerInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    checkAnswer();
  }
});

function handleFormSubmit(event) {
  event.preventDefault();

  const wordText = wordInput.value.trim();
  const meaningText = meaningInput.value.trim();
  const editingWordId = editingWordIdInput.value;

  if (wordText === "" || meaningText === "") {
    showMessage(formMessage, "単語と意味を入力してください。", "error");
    return;
  }

  if (editingWordId) {
    const wasUpdated = updateWord(editingWordId, wordText, meaningText);

    if (!wasUpdated) {
      return;
    }

    showMessage(formMessage, "単語を更新しました。", "success");
  } else {
    addWord(wordText, meaningText);
    showMessage(formMessage, "単語を登録しました。", "success");
  }

  saveWords();
  resetForm(false);
  renderApp();
}

function addWord(wordText, meaningText) {
  const newWord = {
    id: createWordId(),
    word: wordText,
    meaning: meaningText,
    partOfSpeech: partOfSpeechInput.value.trim(),
    example: exampleInput.value.trim(),
    isLearned: false,
    correctCount: 0,
    wrongCount: 0
  };

  words.unshift(newWord);
}

function updateWord(wordId, wordText, meaningText) {
  const targetWord = words.find(function (wordItem) {
    return wordItem.id === wordId;
  });

  if (!targetWord) {
    showMessage(formMessage, "編集する単語が見つかりません。", "error");
    return false;
  }

  targetWord.word = wordText;
  targetWord.meaning = meaningText;
  targetWord.partOfSpeech = partOfSpeechInput.value.trim();
  targetWord.example = exampleInput.value.trim();

  return true;
}

function editWord(wordId) {
  const targetWord = words.find(function (wordItem) {
    return wordItem.id === wordId;
  });

  if (!targetWord) {
    return;
  }

  editingWordIdInput.value = targetWord.id;
  wordInput.value = targetWord.word;
  meaningInput.value = targetWord.meaning;
  partOfSpeechInput.value = targetWord.partOfSpeech;
  exampleInput.value = targetWord.example;
  saveButton.textContent = "更新する";
  cancelEditButton.classList.remove("is-hidden");
  clearMessage(formMessage);
  wordInput.focus();
}

function deleteWord(wordId) {
  const targetWord = words.find(function (wordItem) {
    return wordItem.id === wordId;
  });

  if (!targetWord) {
    return;
  }

  const confirmed = window.confirm(`「${targetWord.word}」を削除しますか？`);

  if (!confirmed) {
    return;
  }

  words = words.filter(function (wordItem) {
    return wordItem.id !== wordId;
  });

  if (currentQuizWord && currentQuizWord.id === wordId) {
    resetQuiz();
  }

  saveWords();
  renderApp();
}

function toggleLearned(wordId) {
  const targetWord = words.find(function (wordItem) {
    return wordItem.id === wordId;
  });

  if (!targetWord) {
    return;
  }

  targetWord.isLearned = !targetWord.isLearned;
  saveWords();
  renderApp();
}

function renderApp() {
  renderStats();
  renderWordList();
}

function renderStats() {
  const learnedWords = words.filter(function (wordItem) {
    return wordItem.isLearned;
  });

  totalCount.textContent = words.length;
  learnedCount.textContent = learnedWords.length;
  notLearnedCount.textContent = words.length - learnedWords.length;
}

function renderWordList() {
  const filteredWords = getFilteredWords();

  wordList.innerHTML = "";
  visibleCount.textContent = `${filteredWords.length}件表示`;

  if (filteredWords.length === 0) {
    emptyMessage.textContent = words.length === 0
      ? "登録された単語はありません。"
      : "条件に合う単語はありません。";
    emptyMessage.classList.remove("is-hidden");
    return;
  }

  emptyMessage.classList.add("is-hidden");

  filteredWords.forEach(function (wordItem) {
    const wordCard = createWordCard(wordItem);
    wordList.appendChild(wordCard);
  });
}

function getFilteredWords() {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  return words.filter(function (wordItem) {
    const statusMatches =
      selectedStatus === "all" ||
      (selectedStatus === "learned" && wordItem.isLearned) ||
      (selectedStatus === "notLearned" && !wordItem.isLearned);

    const searchableText = [
      wordItem.word,
      wordItem.meaning,
      wordItem.partOfSpeech,
      wordItem.example
    ].join(" ").toLowerCase();

    return statusMatches && searchableText.includes(searchText);
  });
}

function createWordCard(wordItem) {
  const wordCard = document.createElement("article");
  wordCard.className = "word-card";

  const header = document.createElement("div");
  header.className = "word-card-header";

  const titleBox = document.createElement("div");
  const wordName = document.createElement("h3");
  wordName.className = "word-name";
  wordName.textContent = wordItem.word;

  const partOfSpeech = document.createElement("span");
  partOfSpeech.className = "word-part";
  partOfSpeech.textContent = wordItem.partOfSpeech || "品詞未設定";

  titleBox.appendChild(wordName);
  titleBox.appendChild(partOfSpeech);

  const stateBadge = document.createElement("span");
  stateBadge.className = wordItem.isLearned ? "state-badge is-learned" : "state-badge";
  stateBadge.textContent = wordItem.isLearned ? "覚えた" : "未学習";

  header.appendChild(titleBox);
  header.appendChild(stateBadge);

  const meaning = document.createElement("p");
  meaning.className = "word-meaning";
  meaning.textContent = `意味: ${wordItem.meaning}`;

  const example = document.createElement("p");
  example.className = "word-example";
  example.textContent = wordItem.example ? `例文: ${wordItem.example}` : "例文: 未設定";

  const score = document.createElement("p");
  score.className = "word-example";
  score.textContent = `テスト: 正解 ${wordItem.correctCount} / 不正解 ${wordItem.wrongCount}`;

  const actions = document.createElement("div");
  actions.className = "word-actions";

  const statusButton = document.createElement("button");
  statusButton.type = "button";
  statusButton.className = wordItem.isLearned ? "status-button is-learned" : "status-button";
  statusButton.textContent = wordItem.isLearned ? "未学習に戻す" : "覚えたにする";
  statusButton.addEventListener("click", function () {
    toggleLearned(wordItem.id);
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary-button";
  editButton.textContent = "編集";
  editButton.addEventListener("click", function () {
    editWord(wordItem.id);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger-button";
  deleteButton.textContent = "削除";
  deleteButton.addEventListener("click", function () {
    deleteWord(wordItem.id);
  });

  actions.appendChild(statusButton);
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  wordCard.appendChild(header);
  wordCard.appendChild(meaning);
  wordCard.appendChild(example);
  wordCard.appendChild(score);
  wordCard.appendChild(actions);

  return wordCard;
}

function startQuiz() {
  if (words.length === 0) {
    resetQuiz();
    showMessage(quizResult, "単語を登録してからテストを開始してください。", "error");
    return;
  }

  currentQuizWord = getRandomWord();
  currentQuizMode = quizMode.value;
  answerInput.value = "";
  clearMessage(quizResult);

  if (currentQuizMode === "wordToMeaning") {
    quizQuestion.textContent = currentQuizWord.word;
    quizSubInfo.textContent = createQuizSubInfo(currentQuizWord);
  } else {
    quizQuestion.textContent = currentQuizWord.meaning;
    quizSubInfo.textContent = createQuizSubInfo(currentQuizWord);
  }

  answerInput.focus();
}

function checkAnswer() {
  if (!currentQuizWord) {
    showMessage(quizResult, "先に問題を出してください。", "error");
    return;
  }

  const userAnswer = answerInput.value.trim();

  if (userAnswer === "") {
    showMessage(quizResult, "答えを入力してください。", "error");
    return;
  }

  const correctAnswer = currentQuizMode === "wordToMeaning"
    ? currentQuizWord.meaning
    : currentQuizWord.word;

  if (normalizeText(userAnswer) === normalizeText(correctAnswer)) {
    currentQuizWord.correctCount += 1;
    currentQuizWord.isLearned = true;
    showMessage(quizResult, "正解です。学習状態を「覚えた」にしました。", "success");
  } else {
    currentQuizWord.wrongCount += 1;
    currentQuizWord.isLearned = false;
    showMessage(quizResult, `不正解です。正解: ${correctAnswer}`, "error");
  }

  saveWords();
  renderApp();
}

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function createWordId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createQuizSubInfo(wordItem) {
  const infoItems = [];

  if (wordItem.partOfSpeech) {
    infoItems.push(`品詞: ${wordItem.partOfSpeech}`);
  }

  if (wordItem.example) {
    infoItems.push(`例文: ${wordItem.example}`);
  }

  return infoItems.join(" / ");
}

function normalizeText(text) {
  return text.trim().toLowerCase();
}

function resetQuiz() {
  currentQuizWord = null;
  currentQuizMode = "";
  quizQuestion.textContent = "単語を登録してから問題を出してください。";
  quizSubInfo.textContent = "";
  answerInput.value = "";
  clearMessage(quizResult);
}

function resetForm(shouldClearMessage = true) {
  editingWordIdInput.value = "";
  wordForm.reset();
  saveButton.textContent = "登録する";
  cancelEditButton.classList.add("is-hidden");

  if (shouldClearMessage) {
    clearMessage(formMessage);
  }
}

function showMessage(targetElement, text, type) {
  targetElement.textContent = text;
  targetElement.className = `message ${type}`;
}

function clearMessage(targetElement) {
  targetElement.textContent = "";
  targetElement.className = "message";
}

function saveWords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch (error) {
    showMessage(formMessage, "データの保存に失敗しました。ブラウザの保存容量を確認してください。", "error");
  }
}

function loadWords() {
  try {
    const savedWords = localStorage.getItem(STORAGE_KEY);
    words = savedWords ? JSON.parse(savedWords) : [];
  } catch (error) {
    words = [];
    showMessage(formMessage, "保存データの読み込みに失敗しました。", "error");
  }
}
