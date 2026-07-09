const STORAGE_KEY = "simpleVocabularyAppWords";

const wordForm = document.getElementById("wordForm");
const editingWordIdInput = document.getElementById("editingWordId");
const wordInput = document.getElementById("wordInput");
const meaningInput = document.getElementById("meaningInput");
const categoryInput = document.getElementById("categoryInput");
const partOfSpeechInput = document.getElementById("partOfSpeechInput");
const exampleInput = document.getElementById("exampleInput");
const formMessage = document.getElementById("formMessage");
const saveButton = document.getElementById("saveButton");
const resetFormButton = document.getElementById("resetFormButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const importCsvInput = document.getElementById("importCsvInput");
const csvMessage = document.getElementById("csvMessage");

const totalCount = document.getElementById("totalCount");
const learnedCount = document.getElementById("learnedCount");
const notLearnedCount = document.getElementById("notLearnedCount");
const visibleCount = document.getElementById("visibleCount");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const wordList = document.getElementById("wordList");
const emptyMessage = document.getElementById("emptyMessage");

const quizMode = document.getElementById("quizMode");
const startQuizButton = document.getElementById("startQuizButton");
const quizQuestion = document.getElementById("quizQuestion");
const quizSubInfo = document.getElementById("quizSubInfo");
const answerInput = document.getElementById("answerInput");
const checkAnswerButton = document.getElementById("checkAnswerButton");
const selfGradeArea = document.getElementById("selfGradeArea");
const correctAnswerText = document.getElementById("correctAnswerText");
const selfCorrectButton = document.getElementById("selfCorrectButton");
const selfWrongButton = document.getElementById("selfWrongButton");
const quizResult = document.getElementById("quizResult");

let words = [];
let currentQuizWord = null;
let currentQuizMode = "";
let currentQuizCorrectAnswer = "";
let currentQuizWasGraded = false;

loadWords();
renderApp();

wordForm.addEventListener("submit", handleFormSubmit);
resetFormButton.addEventListener("click", resetForm);
cancelEditButton.addEventListener("click", resetForm);
exportCsvButton.addEventListener("click", exportCsv);
importCsvInput.addEventListener("change", importCsv);
searchInput.addEventListener("input", renderWordList);
categoryFilter.addEventListener("change", renderWordList);
statusFilter.addEventListener("change", renderWordList);
startQuizButton.addEventListener("click", startQuiz);
checkAnswerButton.addEventListener("click", checkAnswer);
selfCorrectButton.addEventListener("click", function () {
  gradeQuizAnswer(true);
});
selfWrongButton.addEventListener("click", function () {
  gradeQuizAnswer(false);
});

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
    category: categoryInput.value.trim(),
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
  targetWord.category = categoryInput.value.trim();
  targetWord.partOfSpeech = partOfSpeechInput.value.trim();
  targetWord.example = exampleInput.value.trim();

  return true;
}

function exportCsv() {
  if (words.length === 0) {
    showMessage(csvMessage, "エクスポートするデータがありません。", "error");
    return;
  }

  const headerRow = ["単語", "意味", "カテゴリ", "品詞", "例文", "覚えた", "正解数", "不正解数"];
  const dataRows = words.map(function (wordItem) {
    return [
      wordItem.word,
      wordItem.meaning,
      wordItem.category,
      wordItem.partOfSpeech,
      wordItem.example,
      wordItem.isLearned ? "true" : "false",
      wordItem.correctCount,
      wordItem.wrongCount
    ];
  });

  const csvText = [headerRow].concat(dataRows).map(convertToCsvLine).join("\r\n");
  const csvBlob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(csvBlob);
  const downloadLink = document.createElement("a");
  const todayText = new Date().toISOString().slice(0, 10);

  downloadLink.href = downloadUrl;
  downloadLink.download = `vocabulary-data-${todayText}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadUrl);

  showMessage(csvMessage, "CSVをエクスポートしました。", "success");
}

function importCsv() {
  const selectedFile = importCsvInput.files[0];

  if (!selectedFile) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const csvRows = parseCsvRows(String(reader.result));
      const importedWords = convertCsvRowsToWords(csvRows);
      const confirmed = window.confirm(`${importedWords.length}件のデータを追加しますか？`);

      if (!confirmed) {
        importCsvInput.value = "";
        return;
      }

      const previousWords = words;
      words = importedWords.concat(words);

      if (!saveWords(csvMessage)) {
        words = previousWords;
        return;
      }

      resetQuiz();
      renderApp();
      showMessage(csvMessage, `${importedWords.length}件のデータをインポートしました。`, "success");
    } catch (error) {
      showMessage(csvMessage, error.message, "error");
    } finally {
      importCsvInput.value = "";
    }
  };

  reader.onerror = function () {
    showMessage(csvMessage, "CSVファイルの読み込みに失敗しました。", "error");
    importCsvInput.value = "";
  };

  reader.readAsText(selectedFile, "UTF-8");
}

function convertToCsvLine(rowValues) {
  return rowValues.map(function (value) {
    return escapeCsvValue(value);
  }).join(",");
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  const needsQuote = text.includes(",") || text.includes("\"") || text.includes("\n") || text.includes("\r");
  const escapedText = text.replace(/"/g, "\"\"");

  return needsQuote ? `"${escapedText}"` : escapedText;
}

function parseCsvRows(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let isInsideQuote = false;

  for (let index = 0; index < cleanText.length; index += 1) {
    const character = cleanText[index];
    const nextCharacter = cleanText[index + 1];

    if (character === "\"" && isInsideQuote && nextCharacter === "\"") {
      currentValue += "\"";
      index += 1;
    } else if (character === "\"") {
      isInsideQuote = !isInsideQuote;
    } else if (character === "," && !isInsideQuote) {
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((character === "\n" || character === "\r") && !isInsideQuote) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  if (isInsideQuote) {
    throw new Error("CSVの引用符の形式が正しくありません。");
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter(function (row) {
    return row.some(function (value) {
      return value.trim() !== "";
    });
  });
}

function convertCsvRowsToWords(csvRows) {
  if (csvRows.length < 2) {
    throw new Error("CSVにインポートできるデータがありません。");
  }

  const headerRow = csvRows[0].map(function (headerText) {
    return headerText.trim();
  });
  const wordIndex = findColumnIndex(headerRow, ["単語", "word"]);
  const meaningIndex = findColumnIndex(headerRow, ["意味", "meaning"]);
  const categoryIndex = findColumnIndex(headerRow, ["カテゴリ", "category"]);
  const partOfSpeechIndex = findColumnIndex(headerRow, ["品詞", "partOfSpeech", "part_of_speech"]);
  const exampleIndex = findColumnIndex(headerRow, ["例文", "example"]);
  const learnedIndex = findColumnIndex(headerRow, ["覚えた", "isLearned", "learned"]);
  const correctCountIndex = findColumnIndex(headerRow, ["正解数", "correctCount", "correct_count"]);
  const wrongCountIndex = findColumnIndex(headerRow, ["不正解数", "wrongCount", "wrong_count"]);

  if (wordIndex === -1 || meaningIndex === -1) {
    throw new Error("CSVには「単語」と「意味」の列が必要です。");
  }

  const importedWords = [];

  for (let rowIndex = 1; rowIndex < csvRows.length; rowIndex += 1) {
    const row = csvRows[rowIndex];
    const wordText = getCsvValue(row, wordIndex).trim();
    const meaningText = getCsvValue(row, meaningIndex).trim();

    if (wordText === "" || meaningText === "") {
      throw new Error(`CSVの${rowIndex + 1}行目は単語または意味が空です。`);
    }

    importedWords.push({
      id: createWordId(),
      word: wordText,
      meaning: meaningText,
      category: getCsvValue(row, categoryIndex).trim(),
      partOfSpeech: getCsvValue(row, partOfSpeechIndex).trim(),
      example: getCsvValue(row, exampleIndex).trim(),
      isLearned: parseLearnedValue(getCsvValue(row, learnedIndex)),
      correctCount: parseCountValue(getCsvValue(row, correctCountIndex)),
      wrongCount: parseCountValue(getCsvValue(row, wrongCountIndex))
    });
  }

  if (importedWords.length === 0) {
    throw new Error("CSVにインポートできるデータがありません。");
  }

  return importedWords;
}

function findColumnIndex(headerRow, names) {
  const normalizedNames = names.map(function (name) {
    return name.toLowerCase();
  });

  return headerRow.findIndex(function (headerText) {
    return normalizedNames.includes(headerText.toLowerCase());
  });
}

function getCsvValue(row, index) {
  if (index === -1 || index >= row.length) {
    return "";
  }

  return row[index];
}

function parseLearnedValue(value) {
  const normalizedValue = value.trim().toLowerCase();

  return ["true", "1", "yes", "y", "○", "覚えた"].includes(normalizedValue);
}

function parseCountValue(value) {
  const count = Number.parseInt(value, 10);

  return Number.isFinite(count) && count > 0 ? count : 0;
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
  categoryInput.value = targetWord.category;
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
  renderCategoryFilter();
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

function renderCategoryFilter() {
  const selectedCategory = categoryFilter.value;
  const categories = getUniqueCategories();

  categoryFilter.innerHTML = "";
  categoryFilter.appendChild(createOption("all", "すべて"));

  categories.forEach(function (categoryName) {
    categoryFilter.appendChild(createOption(categoryName, categoryName));
  });

  if (selectedCategory === "all" || categories.includes(selectedCategory)) {
    categoryFilter.value = selectedCategory;
  } else {
    categoryFilter.value = "all";
  }
}

function getUniqueCategories() {
  const categorySet = new Set();

  words.forEach(function (wordItem) {
    if (wordItem.category) {
      categorySet.add(wordItem.category);
    }
  });

  return Array.from(categorySet).sort(function (firstCategory, secondCategory) {
    return firstCategory.localeCompare(secondCategory, "ja");
  });
}

function createOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
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
  const selectedCategory = categoryFilter.value;
  const selectedStatus = statusFilter.value;

  return words.filter(function (wordItem) {
    const categoryMatches =
      selectedCategory === "all" ||
      wordItem.category === selectedCategory;

    const statusMatches =
      selectedStatus === "all" ||
      (selectedStatus === "learned" && wordItem.isLearned) ||
      (selectedStatus === "notLearned" && !wordItem.isLearned);

    const searchableText = [
      wordItem.word,
      wordItem.meaning,
      wordItem.category,
      wordItem.partOfSpeech,
      wordItem.example
    ].join(" ").toLowerCase();

    return categoryMatches && statusMatches && searchableText.includes(searchText);
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

  if (wordItem.category) {
    const category = document.createElement("span");
    category.className = "word-category";
    category.textContent = wordItem.category;
    titleBox.appendChild(category);
  }

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
  currentQuizCorrectAnswer = getQuizCorrectAnswer(currentQuizWord, currentQuizMode);
  currentQuizWasGraded = false;
  answerInput.value = "";
  answerInput.disabled = false;
  checkAnswerButton.disabled = false;
  resetSelfGradeControls();
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

  correctAnswerText.textContent = `正解: ${currentQuizCorrectAnswer}`;
  selfGradeArea.classList.remove("is-hidden");

  if (normalizeText(userAnswer) === normalizeText(currentQuizCorrectAnswer)) {
    showMessage(quizResult, "入力した答えは正解と一致しています。自己採点で確定してください。", "success");
  } else {
    showMessage(quizResult, "正解を確認して、自己採点で結果を確定してください。", "success");
  }
}

function gradeQuizAnswer(isCorrect) {
  if (!currentQuizWord) {
    showMessage(quizResult, "先に問題を出してください。", "error");
    return;
  }

  if (currentQuizCorrectAnswer === "") {
    showMessage(quizResult, "先に答えを確認してください。", "error");
    return;
  }

  if (currentQuizWasGraded) {
    return;
  }

  if (isCorrect) {
    currentQuizWord.correctCount += 1;
    currentQuizWord.isLearned = true;
    showMessage(quizResult, "正解として記録しました。学習状態を「覚えた」にしました。", "success");
  } else {
    currentQuizWord.wrongCount += 1;
    currentQuizWord.isLearned = false;
    showMessage(quizResult, "不正解として記録しました。学習状態を「未学習」にしました。", "error");
  }

  currentQuizWasGraded = true;
  answerInput.disabled = true;
  checkAnswerButton.disabled = true;
  selfCorrectButton.disabled = true;
  selfWrongButton.disabled = true;
  saveWords();
  renderApp();
}

function getQuizCorrectAnswer(wordItem, selectedQuizMode) {
  if (selectedQuizMode === "wordToMeaning") {
    return wordItem.meaning;
  }

  return wordItem.word;
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

  if (wordItem.category) {
    infoItems.push(`カテゴリ: ${wordItem.category}`);
  }

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
  currentQuizCorrectAnswer = "";
  currentQuizWasGraded = false;
  quizQuestion.textContent = "単語を登録してから問題を出してください。";
  quizSubInfo.textContent = "";
  answerInput.value = "";
  answerInput.disabled = false;
  checkAnswerButton.disabled = false;
  resetSelfGradeControls();
  clearMessage(quizResult);
}

function resetSelfGradeControls() {
  correctAnswerText.textContent = "";
  selfGradeArea.classList.add("is-hidden");
  selfCorrectButton.disabled = false;
  selfWrongButton.disabled = false;
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

function saveWords(messageTarget = formMessage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return true;
  } catch (error) {
    showMessage(messageTarget, "データの保存に失敗しました。ブラウザの保存容量を確認してください。", "error");
    return false;
  }
}

function loadWords() {
  try {
    const savedWords = localStorage.getItem(STORAGE_KEY);
    const parsedWords = savedWords ? JSON.parse(savedWords) : [];

    if (!Array.isArray(parsedWords)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    words = parsedWords.map(normalizeStoredWord).filter(function (wordItem) {
      return wordItem !== null;
    });
  } catch (error) {
    words = [];
    showMessage(formMessage, "保存データの読み込みに失敗しました。", "error");
  }
}

function normalizeStoredWord(wordItem) {
  if (!wordItem || typeof wordItem !== "object") {
    return null;
  }

  const wordText = String(wordItem.word || "").trim();
  const meaningText = String(wordItem.meaning || "").trim();

  if (wordText === "" || meaningText === "") {
    return null;
  }

  return {
    id: String(wordItem.id || createWordId()),
    word: wordText,
    meaning: meaningText,
    category: String(wordItem.category || "").trim(),
    partOfSpeech: String(wordItem.partOfSpeech || "").trim(),
    example: String(wordItem.example || "").trim(),
    isLearned: Boolean(wordItem.isLearned),
    correctCount: parseCountValue(String(wordItem.correctCount || "")),
    wrongCount: parseCountValue(String(wordItem.wrongCount || ""))
  };
}
