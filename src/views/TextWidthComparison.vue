<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

// テキストエリアのデータ型
interface TextAreaData {
  text: string
  width: number
  fullWidthCount: number
  halfWidthCount: number
  exceedsReference: boolean
}

// 3つのテキストエリアの状態管理（デフォルト文字列を設定）
const textAreas = ref<TextAreaData[]>([
  {
    text: 'あいうえおかきくけこ1234567890',
    width: 0,
    fullWidthCount: 0,
    halfWidthCount: 0,
    exceedsReference: false,
  },
  {
    text: 'あいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえお',
    width: 0,
    fullWidthCount: 0,
    halfWidthCount: 0,
    exceedsReference: false,
  },
  {
    text: 'あいうえおかきくけこ1234567890あいうえおかきくけこ1234567890\nあいうえおかきくけこ1234567890あいうえおかきくけこ1234567890あいうえお',
    width: 0,
    fullWidthCount: 0,
    halfWidthCount: 0,
    exceedsReference: false,
  },
])

const maxLength = 300

// 基準文字数（デフォルトは35文字）
const referenceCharCount = ref(35)

// 測定用の要素への参照（各テキストエリア用）
const measurementRefs = ref<(HTMLSpanElement | null)[]>([null, null, null])
const referenceMeasurementRef = ref<HTMLSpanElement | null>(null)

// 基準幅の測定結果
const referenceWidth = ref(0)

// 1em = 16px(フォントサイズ)
const EM_TO_PX = 16

// フォント読み込み完了フラグ
const fontLoaded = ref(false)

// 全角N文字の基準テキスト(「あ」をN個)
const referenceText = computed(() => 'あ'.repeat(referenceCharCount.value))

// 基準幅の理論値（1em * 基準文字数）
const theoreticalReferenceWidth = computed(() => {
  return EM_TO_PX * referenceCharCount.value
})

// 全角/半角文字数をカウント
const countCharacters = (text: string) => {
  let fullWidth = 0
  let halfWidth = 0

  for (const char of text) {
    // 日本語文字(ひらがな、カタカナ、漢字)を全角とみなす
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(char)) {
      fullWidth++
    } else {
      halfWidth++
    }
  }

  return { fullWidth, halfWidth }
}

// 文字幅を測定する関数
const measureWidth = async (index: number) => {
  await nextTick()

  // 基準線の幅を測定
  if (referenceMeasurementRef.value) {
    referenceMeasurementRef.value.textContent = referenceText.value
    referenceWidth.value = referenceMeasurementRef.value.getBoundingClientRect().width
  }

  // 指定されたテキストエリアの幅を測定
  const textarea = textAreas.value[index]
  const measurementRef = measurementRefs.value[index]

  // textareaが存在しない場合は早期リターン
  if (!textarea) {
    return
  }

  if (measurementRef) {
    // 改行で分割して各行の幅を測定し、最大値を取得
    const lines = textarea.text.split('\n')
    let maxWidth = 0

    for (const line of lines) {
      measurementRef.textContent = line
      const lineWidth = measurementRef.getBoundingClientRect().width
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth
      }
    }

    textarea.width = maxWidth
  } else {
    textarea.width = 0
  }

  // 全角/半角文字数をカウント
  const { fullWidth, halfWidth } = countCharacters(textarea.text)
  textarea.fullWidthCount = fullWidth
  textarea.halfWidthCount = halfWidth

  // 基準幅超過判定
  textarea.exceedsReference = textarea.width > theoreticalReferenceWidth.value
}

// 入力時のハンドラー
const handleInput = (index: number) => {
  measureWidth(index)
}

// 基準文字数変更時のハンドラー
const handleReferenceCharCountChange = () => {
  // 1以上の値に制限
  if (referenceCharCount.value < 1) {
    referenceCharCount.value = 1
  }
  // 全テキストエリアを再測定
  textAreas.value.forEach((_, index) => {
    measureWidth(index)
  })
}

// 入力文字数を取得
const inputCharCount = (index: number) => {
  // オプショナルチェーンを使用して、undefinedの場合に安全に処理
  return textAreas.value[index]?.text.length ?? 0
}

// 文字数ルーラーの最大値を計算
const rulerMaxCount = computed(() => {
  // テキストエリアの幅を想定(800px程度)
  // 実際の幅に応じて動的に計算
  const estimatedWidth = 800
  return Math.ceil(estimatedWidth / EM_TO_PX)
})

// フォント読み込み待機
onMounted(async () => {
  try {
    await document.fonts.ready
    fontLoaded.value = true

    // 初期測定
    textAreas.value.forEach((_, index) => {
      measureWidth(index)
    })
  } catch (error) {
    console.error('Font loading error:', error)
    fontLoaded.value = true
  }
})
</script>

<template>
  <div class="text-width-comparison">
    <div class="header">
      <router-link to="/" class="back-link">← パス一覧に戻る</router-link>
      <h1>文字幅比較ツール</h1>
    </div>

    <div v-if="!fontLoaded" class="loading">フォントを読み込み中...</div>

    <div v-else class="main-content">
      <!-- 左側: テキストエリアセクション -->
      <div class="textarea-section">
        <div class="control-group">
          <label for="reference-char-count">基準文字数:</label>
          <div class="input-wrapper">
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

        <!-- 3つのテキストエリア -->
        <div v-for="(textarea, index) in textAreas" :key="index" class="textarea-container">
          <!-- 文字数ルーラー -->
          <div class="ruler">
            <span
              v-for="num in rulerMaxCount"
              :key="num"
              class="ruler-tick"
              :class="{ 'has-number': num % 10 === 0 }"
            >
              <span v-if="num % 10 === 0" class="ruler-number">{{ num }}</span>
            </span>
          </div>

          <!-- テキストエリア -->
          <div class="textarea-wrapper" :style="{ '--reference-char-count': referenceCharCount }">
            <textarea
              v-model="textarea.text"
              :maxlength="maxLength"
              placeholder="ここにテキストを入力..."
              rows="3"
              :class="{ 'exceeds-reference': textarea.exceedsReference }"
              @input="handleInput(index)"
            ></textarea>
          </div>

          <!-- 入力情報 -->
          <div class="input-info">
            <span class="info-text" :class="{ exceeds: textarea.exceedsReference }">
              入力文字列: 全角 {{ textarea.fullWidthCount }} 文字, 半角
              {{ textarea.halfWidthCount }} 文字, 合計 {{ textarea.width.toFixed(2) }} px
            </span>
            <span
              class="char-counter"
              :class="{ warning: inputCharCount(index) >= maxLength - 50 }"
            >
              {{ inputCharCount(index) }} / {{ maxLength }} 文字
            </span>
          </div>
        </div>
      </div>

      <!-- 右側: 計算式セクション -->
      <div class="calculation-section">
        <h2>計算式</h2>
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
    </div>

    <!-- 測定用の非表示要素 -->
    <span ref="referenceMeasurementRef" class="measurement-span"></span>
    <span
      v-for="(_, index) in textAreas"
      :key="index"
      :ref="(el) => (measurementRefs[index] = el as HTMLSpanElement)"
      class="measurement-span"
    ></span>
  </div>
</template>

<style scoped>
.text-width-comparison {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #42b983;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

/* 左側: テキストエリアセクション */
.textarea-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-group label {
  font-weight: 600;
  color: #2c3e50;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group input[type='number'] {
  width: 80px;
  padding: 0.5rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.control-group input[type='number']:focus {
  outline: none;
  border-color: #42b983;
}

.unit {
  color: #666;
  font-size: 0.9rem;
}

/* テキストエリアコンテナ */
.textarea-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 文字数ルーラー */
.ruler {
  display: flex;
  font-size: 16px; /* 1em = 16px に設定 */
  color: #999;
  padding: 0;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid #ddd;
  position: relative;
}

.ruler-tick {
  width: 1em;
  height: 8px;
  position: relative;
  border-left: 1px solid #ddd;
  display: flex;
  align-items: flex-start;
}

.ruler-tick.has-number {
  border-left: 1px solid #999;
}

.ruler-number {
  font-family: monospace;
  position: absolute;
  top: -2px;
  left: 2px;
  font-size: 0.7rem;
}

/* テキストエリアラッパー */
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
  border-radius: 4px;
  resize: vertical;
  transition: border-color 0.3s;
}

textarea:focus {
  outline: none;
  border-color: #42b983;
}

/* 基準幅超過時の赤枠 */
textarea.exceeds-reference {
  border-color: #e74c3c;
}

/* 入力情報 */
.input-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.info-text {
  color: #555;
}

.info-text.exceeds {
  color: #e74c3c;
  font-weight: 600;
}

.char-counter {
  color: #666;
}

.char-counter.warning {
  color: #e74c3c;
  font-weight: 600;
}

/* 右側: 計算式セクション */
.calculation-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.calculation-section h2 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.calc-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
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

/* 測定用の非表示要素 */
.measurement-span {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  font-size: 16px;
  font-family: 'Noto Sans JP', sans-serif;
}

/* レスポンシブ対応 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .calculation-section {
    position: static;
  }
}
</style>
