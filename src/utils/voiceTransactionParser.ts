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

export function parseVoiceTransaction(text: string): ParsedTransaction {
  const result: ParsedTransaction = {}
  const lowerText = text.toLowerCase().trim()
  const tokens = lowerText.split(/\s+/)

  // 1. Detect transaction type
  for (const token of tokens) {
    if (token in typeKeywords) {
      result.type = typeKeywords[token]
      break
    }
  }

  // 2. Parse amount
  const amountResult = parseAmount(lowerText)

  if (amountResult) {
    result.amount = amountResult.amount

    // 3. Extract description = everything that's not type keyword or amount tokens
    const descTokens = tokens.filter((token, i) => {
      if (token in typeKeywords) return false
      if (amountResult.usedTokens.includes(i)) return false

      // Filter out multiplier words that might not be in usedTokens
      if (['ribu', 'rb', 'juta', 'jt', 'ratus', 'miliar', 'milyar'].includes(token)) return false

      return true
    })

    if (descTokens.length > 0) {
      result.description = descTokens.join(' ').replace(/^\s+|\s+$/g, '').replace(/^[-,.\s]+|[-,.\s]+$/g, '')
    }
  } else {
    // No amount found — try to get description from everything except type keyword
    const descTokens = tokens.filter(token => !(token in typeKeywords))

    if (descTokens.length > 0) {
      result.description = descTokens.join(' ')
    }
  }

  return result
}

export type { ParsedTransaction }
