/**
 * Parse spoken Indonesian text into transaction data.
 *
 * Examples:
 *   "pengeluaran 50 ribu beli nasi goreng"
 *   "pemasukan 5 juta gaji bulan maret"
 *   "transfer 2 juta 500 ke bank BSI"
 *   "nabung 1 juta dana darurat"
 *   "keluar 15 ribu beli kopi"
 *   "masuk 200 ribu dari jualan"
 */

type ParsedTransaction = {
  type?: 'income' | 'expense' | 'savings' | 'transfer'
  amount?: number
  description?: string
  storageHint?: string
  categoryHint?: string
}

const typeKeywords: Record<string, 'income' | 'expense' | 'savings' | 'transfer'> = {
  // Income
  pemasukan: 'income',
  masuk: 'income',
  terima: 'income',
  dapat: 'income',
  pendapatan: 'income',
  // Expense
  pengeluaran: 'expense',
  keluar: 'expense',
  beli: 'expense',
  bayar: 'expense',
  belanja: 'expense',
  // Savings
  tabungan: 'savings',
  nabung: 'savings',
  simpan: 'savings',
  menabung: 'savings',
  // Transfer
  transfer: 'transfer',
  kirim: 'transfer',
  pindah: 'transfer'
}

/**
 * Parse Indonesian number words and mixed formats into a numeric value.
 *
 * Supports:
 *   "50 ribu" → 50000
 *   "5 juta" → 5000000
 *   "2 juta 500 ribu" → 2500000
 *   "1,5 juta" → 1500000
 *   "100rb" → 100000
 *   "15000" → 15000
 *   "dua ratus ribu" → 200000
 *   "satu juta" → 1000000
 */

const wordToNumber: Record<string, number> = {
  nol: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000
}

function parseAmount(text: string): { amount: number; usedTokens: number[] } | null {
  const tokens = text.toLowerCase().split(/\s+/)
  let amount = 0
  let current = 0
  let found = false
  const usedIndices: number[] = []

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i]

    // Handle "100rb", "50ribu", "5jt", "2juta" (no space)
    const compactMatch = token.match(/^(\d+[.,]?\d*)(rb|ribu|jt|juta|k|m)$/i)

    if (compactMatch) {
      const num = parseFloat(compactMatch[1].replace(',', '.'))
      const unit = compactMatch[2].toLowerCase()
      const multiplier =
        unit === 'rb' || unit === 'ribu' || unit === 'k' ? 1000 : unit === 'jt' || unit === 'juta' || unit === 'm' ? 1000000 : 1

      amount += num * multiplier
      found = true
      usedIndices.push(i)
      continue
    }

    // Handle plain numbers: "50000", "15.000", "1.500.000"
    const plainNumber = token.replace(/\./g, '').replace(',', '.')

    if (/^\d+(\.\d+)?$/.test(plainNumber)) {
      const num = parseFloat(plainNumber)

      // Check if next token is a multiplier
      const next = tokens[i + 1]?.toLowerCase()

      if (next === 'ribu' || next === 'rb') {
        amount += num * 1000
        usedIndices.push(i, i + 1)
        i++
      } else if (next === 'juta' || next === 'jt') {
        amount += num * 1000000
        usedIndices.push(i, i + 1)
        i++
      } else if (next === 'miliar' || next === 'milyar') {
        amount += num * 1000000000
        usedIndices.push(i, i + 1)
        i++
      } else if (num >= 1000) {
        // Standalone large number like "50000"
        amount += num
        usedIndices.push(i)
      } else {
        // Small number without multiplier, check context
        // Could be part of "2 juta 500 ribu" where 500 comes next
        const nextNext = tokens[i + 2]?.toLowerCase()

        if (nextNext === 'ribu' || nextNext === 'rb') {
          // This might be like "2 500 ribu" - skip, let next iteration handle
          current = num
          usedIndices.push(i)
        } else if (amount > 0) {
          // Add to existing amount (e.g., after "2 juta" comes "500")
          amount += num * (amount >= 1000000 ? 1000 : 1)
          usedIndices.push(i)
        } else {
          current = num
          usedIndices.push(i)
        }
      }

      found = true
      continue
    }

    // Handle word numbers
    if (token in wordToNumber) {
      current = wordToNumber[token]
      usedIndices.push(i)

      const next = tokens[i + 1]?.toLowerCase()

      if (next === 'ribu' || next === 'rb') {
        amount += current * 1000
        current = 0
        usedIndices.push(i + 1)
        i++
      } else if (next === 'juta' || next === 'jt') {
        amount += current * 1000000
        current = 0
        usedIndices.push(i + 1)
        i++
      } else if (next === 'ratus') {
        current *= 100
        usedIndices.push(i + 1)
        i++

        const nextAfter = tokens[i + 1]?.toLowerCase()

        if (nextAfter === 'ribu') {
          amount += current * 1000
          current = 0
          usedIndices.push(i + 1)
          i++
        } else if (nextAfter === 'juta') {
          amount += current * 1000000
          current = 0
          usedIndices.push(i + 1)
          i++
        }
      }

      found = true
      continue
    }

    // Handle "setengah juta", "sejuta", "seribu"
    if (token === 'setengah') {
      const next = tokens[i + 1]?.toLowerCase()

      if (next === 'juta') {
        amount += 500000
        usedIndices.push(i, i + 1)
        i++
        found = true
      } else if (next === 'ribu') {
        amount += 500
        usedIndices.push(i, i + 1)
        i++
        found = true
      }

      continue
    }

    if (token === 'sejuta') {
      amount += 1000000
      usedIndices.push(i)
      found = true
      continue
    }

    if (token === 'seribu') {
      amount += 1000
      usedIndices.push(i)
      found = true
      continue
    }

    // "seratus" standalone
    if (token === 'seratus') {
      current = 100
      usedIndices.push(i)

      const next = tokens[i + 1]?.toLowerCase()

      if (next === 'ribu') {
        amount += 100000
        current = 0
        usedIndices.push(i + 1)
        i++
      } else if (next === 'juta') {
        amount += 100000000
        current = 0
        usedIndices.push(i + 1)
        i++
      }

      found = true
      continue
    }
  }

  amount += current

  if (!found || amount === 0) return null

  return { amount, usedTokens: usedIndices }
}

/**
 * Extract storage hint from phrases like:
 *   "dari BSI", "dari bank BCA", "dari dompet", "ke dana", "ke bank mandiri"
 */
function extractStorageHint(text: string): { hint: string; cleaned: string } | null {
  // Match "dari <name>" or "ke <name>" patterns for storage
  const patterns = [
    /\b(?:dari|ambil dari|dari simpanan|dari rekening|dari bank)\s+(.+?)(?:\s+(?:kategori|untuk|buat)\b|$)/i,
    /\b(?:ke|masuk ke|ke simpanan|ke rekening|ke bank)\s+(.+?)(?:\s+(?:kategori|untuk|buat)\b|$)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match) {
      const hint = match[1].trim()
        .replace(/\s+(kategori|untuk|buat).*$/i, '')
        .trim()

      if (hint) {
        const cleaned = text.replace(match[0], ' ').trim()

        return { hint, cleaned }
      }
    }
  }

  return null
}

/**
 * Extract category hint from phrases like:
 *   "kategori makanan", "untuk transportasi", "buat belanja"
 */
function extractCategoryHint(text: string): { hint: string; cleaned: string } | null {
  const patterns = [
    /\b(?:kategori|kategori pengeluaran|kategori tabungan)\s+(.+?)$/i,
    /\b(?:untuk|buat|jenis)\s+(.+?)(?:\s+(?:dari|ke)\b|$)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match) {
      const hint = match[1].trim()

      if (hint) {
        const cleaned = text.replace(match[0], ' ').trim()

        return { hint, cleaned }
      }
    }
  }

  return null
}

export function parseVoiceTransaction(text: string): ParsedTransaction {
  const result: ParsedTransaction = {}
  let workingText = text.toLowerCase().trim()

  // 1. Detect transaction type
  const tokens = workingText.split(/\s+/)

  for (const token of tokens) {
    if (token in typeKeywords) {
      result.type = typeKeywords[token]
      break
    }
  }

  // 2. Extract storage hint (before amount parsing to avoid interference)
  const storageResult = extractStorageHint(workingText)

  if (storageResult) {
    result.storageHint = storageResult.hint
    workingText = storageResult.cleaned
  }

  // 3. Extract category hint
  const categoryResult = extractCategoryHint(workingText)

  if (categoryResult) {
    result.categoryHint = categoryResult.hint
    workingText = categoryResult.cleaned
  }

  // 4. Parse amount
  const finalTokens = workingText.split(/\s+/)
  const amountResult = parseAmount(workingText)

  if (amountResult) {
    result.amount = amountResult.amount

    // 5. Extract description = everything that's not type keyword, amount, or extracted hints
    const descTokens = finalTokens.filter((token, i) => {
      if (token in typeKeywords) return false
      if (amountResult.usedTokens.includes(i)) return false
      if (['ribu', 'rb', 'juta', 'jt', 'ratus', 'miliar', 'milyar'].includes(token)) return false

      return true
    })

    if (descTokens.length > 0) {
      result.description = descTokens.join(' ').replace(/^\s+|\s+$/g, '').replace(/^[-,.\s]+|[-,.\s]+$/g, '')
    }
  } else {
    const descTokens = finalTokens.filter(token => !(token in typeKeywords))

    if (descTokens.length > 0) {
      result.description = descTokens.join(' ')
    }
  }

  return result
}

/**
 * Fuzzy match a voice hint against a list of named items.
 * Returns the ID of the best match, or empty string if no match.
 */
export function fuzzyMatchName(hint: string, items: { id: string; name: string }[]): string {
  if (!hint || items.length === 0) return ''

  const h = hint.toLowerCase().trim()

  // 1. Exact match
  const exact = items.find(item => item.name.toLowerCase() === h)

  if (exact) return exact.id

  // 2. Item name contains hint or hint contains item name
  const contains = items.find(
    item => item.name.toLowerCase().includes(h) || h.includes(item.name.toLowerCase())
  )

  if (contains) return contains.id

  // 3. Word overlap scoring
  const hintWords = h.split(/\s+/)
  let bestScore = 0
  let bestId = ''

  for (const item of items) {
    const nameWords = item.name.toLowerCase().split(/\s+/)
    let score = 0

    for (const hw of hintWords) {
      for (const nw of nameWords) {
        if (nw.includes(hw) || hw.includes(nw)) {
          score += 1
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestId = item.id
    }
  }

  return bestScore > 0 ? bestId : ''
}

export type { ParsedTransaction }
