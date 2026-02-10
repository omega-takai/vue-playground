<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

// 入力テキスト（デフォルトでサンプル文字列を設定）
const inputText = ref(
  'あいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえお\n123456789012345678901234567890123456789012345678901234567890',
)
const maxLength = 300

// 基準文字数（デフォルトは60文字）
const referenceCharCount = ref(35)

// 測定用の要素への参照
const measurementRef = ref<HTMLSpanElement | null>(null)
const referenceMeasurementRef = ref<HTMLSpanElement | null>(null)

// 測定結果
const referenceWidth = ref(0)
const inputWidth = ref(0)

// 残り文字数
const remainingChars = computed(() => maxLength - inputText.value.length)

// 全角N文字の基準テキスト(「あ」をN個)
const referenceText = computed(() => 'あ'.repeat(referenceCharCount.value))

// 1em = 16px(フォントサイズ)
const EM_TO_PX = 16

// フォント読み込み完了フラグ
const fontLoaded = ref(false)

// 文字幅を測定する関数
const measureWidth = async () => {
  await nextTick()

  // 基準線の幅を測定
  if (referenceMeasurementRef.value) {
    referenceMeasurementRef.value.textContent = referenceText.value
    referenceWidth.value = referenceMeasurementRef.value.getBoundingClientRect().width
  }

  // 入力文字列の幅を測定
  if (measurementRef.value && inputText.value) {
    // 改行で分割して各行の幅を測定し、最大値を取得
    const lines = inputText.value.split('\n')
    let maxWidth = 0

    for (const line of lines) {
      measurementRef.value.textContent = line
      const lineWidth = measurementRef.value.getBoundingClientRect().width
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth
      }
    }

    inputWidth.value = maxWidth
  } else {
    inputWidth.value = 0
  }
}

// 入力時のハンドラー
const handleInput = () => {
  measureWidth()
}

// 基準文字数変更時のハンドラー
const handleReferenceCharCountChange = () => {
  // 1以上の値に制限
  if (referenceCharCount.value < 1) {
    referenceCharCount.value = 1
  }
  measureWidth()
}

// 差分を計算
const widthDifference = computed(() => {
  return inputWidth.value - referenceWidth.value
})

// 基準幅の理論値（1em * 基準文字数）
const theoreticalReferenceWidth = computed(() => {
  return EM_TO_PX * referenceCharCount.value
})

// 差分の表示テキスト
const differenceText = computed(() => {
  const diff = widthDifference.value
  if (diff > 0) {
    return `+${diff.toFixed(2)}px (基準より長い)`
  } else if (diff < 0) {
    return `${diff.toFixed(2)}px (基準より短い)`
  } else {
    return '0px (基準と同じ)'
  }
})

// バーの幅を計算(最大幅を基準に正規化)
const referenceBarWidth = computed(() => {
  const maxWidth = Math.max(referenceWidth.value, inputWidth.value)
  return maxWidth > 0 ? (referenceWidth.value / maxWidth) * 100 : 0
})

const inputBarWidth = computed(() => {
  const maxWidth = Math.max(referenceWidth.value, inputWidth.value)
  return maxWidth > 0 ? (inputWidth.value / maxWidth) * 100 : 0
})

// フォント読み込みを待機
onMounted(async () => {
  try {
    // Noto Sans JPフォントの読み込みを待機
    await document.fonts.load('16px "Noto Sans JP"')
    fontLoaded.value = true
    // フォント読み込み後に初期測定
    measureWidth()
  } catch (error) {
    console.error('フォントの読み込みに失敗しました:', error)
    fontLoaded.value = true // エラーでも続行
    measureWidth()
  }
})
</script>

<template>
  <div class="comparison-container">
    <header class="header">
      <router-link to="/" class="back-link">← パス一覧に戻る</router-link>
      <h1>文字幅比較ツール</h1>
    </header>

    <div class="content">
      <div class="input-section">
        <div class="controls">
          <div class="control-group">
            <label for="reference-char-count">基準文字数:</label>
            <input
              id="reference-char-count"
              v-model.number="referenceCharCount"
              type="number"
              min="1"
              max="200"
              @input="handleReferenceCharCountChange"
            />
            <span class="unit">文字</span>
          </div>
        </div>

        <label for="text-input">テキストを入力してください (最大{{ maxLength }}文字)</label>
        <div class="textarea-wrapper" :style="{ '--reference-char-count': referenceCharCount }">
          <textarea
            id="text-input"
            v-model="inputText"
            :maxlength="maxLength"
            placeholder="ここにテキストを入力..."
            rows="6"
            @input="handleInput"
          ></textarea>
        </div>
        <div class="char-counter" :class="{ warning: remainingChars < 50 }">
          残り {{ remainingChars }} 文字
        </div>
      </div>

      <div v-if="fontLoaded" class="comparison-section">
        <h2>文字幅の比較</h2>

        <div class="measurement-info">
          <div class="info-item">
            <span class="label">基準幅 (全角{{ referenceCharCount }}文字):</span>
            <span class="value">{{ referenceWidth.toFixed(2) }}px</span>
          </div>
          <div class="info-item">
            <span class="label">入力文字列の幅:</span>
            <span class="value">{{ inputWidth.toFixed(2) }}px</span>
          </div>
          <div class="info-item">
            <span class="label">差分:</span>
            <span
              class="value"
              :class="{ positive: widthDifference > 0, negative: widthDifference < 0 }"
            >
              {{ differenceText }}
            </span>
          </div>
        </div>

        <div class="calculation-info">
          <h3>計算式</h3>
          <div class="calc-item">
            <span class="calc-label">フォントサイズ（1emと等価）:</span>
            <span class="calc-formula">{{ EM_TO_PX }} px</span>
          </div>
          <div class="calc-item">
            <span class="calc-label">基準幅の計算:</span>
            <span class="calc-formula"
              >1em ({{ EM_TO_PX }}px) × {{ referenceCharCount }}文字 =
              {{ theoreticalReferenceWidth }} px</span
            >
          </div>
        </div>

        <div class="visual-comparison">
          <div class="bar-container">
            <div class="bar-label">基準線 (全角{{ referenceCharCount }}文字)</div>
            <div class="bar-wrapper">
              <div class="bar reference-bar" :style="{ width: referenceBarWidth + '%' }">
                <span class="bar-text">{{ referenceWidth.toFixed(0) }}px</span>
              </div>
            </div>
          </div>

          <div class="bar-container">
            <div class="bar-label">入力文字列</div>
            <div class="bar-wrapper">
              <div
                class="bar input-bar"
                :style="{ width: inputBarWidth + '%' }"
                :class="{ empty: inputWidth === 0 }"
              >
                <span v-if="inputWidth > 0" class="bar-text">{{ inputWidth.toFixed(0) }}px</span>
                <span v-else class="bar-text empty-text">テキストを入力してください</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading">フォントを読み込み中...</div>
    </div>

    <!-- 測定用の非表示要素 -->
    <span ref="measurementRef" class="measurement-span"></span>
    <span ref="referenceMeasurementRef" class="measurement-span"></span>
  </div>
</template>

<style scoped>
.comparison-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Noto Sans JP', sans-serif;
}

.header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #42b983;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.control-group input[type='number'] {
  width: 80px;
  padding: 0.5rem;
  font-size: 16px;
  font-family: 'Noto Sans JP', sans-serif;
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.control-group input[type='number']:focus {
  outline: none;
  border-color: #42b983;
}

.unit {
  color: #666;
  font-size: 0.9rem;
}

label {
  font-weight: 600;
  color: #2c3e50;
}

.textarea-wrapper {
  position: relative;
}

/* referenceCharCount emの位置に赤い縦線を表示 */
.textarea-wrapper::before {
  content: '';
  position: absolute;
  left: calc(var(--reference-char-count) * 1em);
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e74c3c;
  z-index: 10;
  pointer-events: none;
}

textarea {
  width: 100%;
  font-size: 16px;
  font-family: 'Noto Sans JP', sans-serif;
  border: 2px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  transition: border-color 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: #42b983;
}

.char-counter {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.char-counter.warning {
  color: #e74c3c;
  font-weight: 600;
}

.comparison-section {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 12px;
}

.measurement-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  font-family: monospace;
  font-size: 1.1rem;
  color: #2c3e50;
}

.value.positive {
  color: #e74c3c;
}

.value.negative {
  color: #3498db;
}

.calculation-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
}

.calculation-info h3 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.calc-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.calc-item:last-child {
  margin-bottom: 0;
}

.calc-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.calc-formula {
  font-family: monospace;
  font-size: 0.95rem;
  color: #2c3e50;
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
}

.calc-formula.positive {
  color: #e74c3c;
}

.calc-formula.negative {
  color: #3498db;
}

.visual-comparison {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bar-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.bar-wrapper {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 40px;
}

.bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  border-radius: 8px;
}

.reference-bar {
  background: linear-gradient(90deg, #42b983, #35a372);
}

.input-bar {
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.input-bar.empty {
  background: #bdc3c7;
  width: 100% !important;
}

.bar-text {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.empty-text {
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

/* 測定用の非表示要素 */
.measurement-span {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  font-size: 16px;
  font-family: 'Noto Sans JP', sans-serif;
}
</style>
