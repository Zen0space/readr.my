import { useEffect, useMemo, useState } from 'react'
import { getEarnings, type EarningsBucket, type EarningsPeriod, type EarningsResponse } from '../api/earnings'

const PERIODS: { value: EarningsPeriod; label: string; days: number }[] = [
  { value: 'day', label: 'Daily (30d)', days: 30 },
  { value: 'week', label: 'Weekly (12w)', days: 90 },
  { value: 'month', label: 'Monthly (12m)', days: 365 },
]

export const EarningsRoute = () => {
  const [period, setPeriod] = useState<EarningsPeriod>('day')
  const [data, setData] = useState<EarningsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const p = PERIODS.find((x) => x.value === period)!
    setLoading(true)
    getEarnings(period, p.days)
      .then((res) => {
        setData(res)
        setError(null)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [period])

  const summary = useMemo(() => {
    if (!data) return { coins: 0, rmCents: 0, coinShare: 0, subShare: 0 }
    let coins = 0
    let rmCents = 0
    let coinShare = 0
    let subShare = 0
    for (const b of data.buckets) {
      coins += b.author_cut_coins
      rmCents += b.author_cut_rm_cents
      if (b.source === 'coin') coinShare += b.author_cut_coins
      else subShare += b.author_cut_coins
    }
    return { coins, rmCents, coinShare, subShare }
  }, [data])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Earnings</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {PERIODS.map((p) => {
            const active = p.value === period
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                style={{
                  appearance: 'none',
                  border: '1px solid #e5e7eb',
                  background: active ? '#111827' : '#fff',
                  color: active ? '#fff' : '#374151',
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <Stat label="Coins (your cut)" value={summary.coins.toLocaleString()} />
        <Stat
          label="RM (your cut)"
          value={`RM ${(summary.rmCents / 100).toFixed(2)}`}
        />
        <Stat
          label="Coin / Sub split"
          value={
            summary.coinShare + summary.subShare === 0
              ? '—'
              : `${pct(summary.coinShare, summary.coinShare + summary.subShare)} / ${pct(
                  summary.subShare,
                  summary.coinShare + summary.subShare,
                )}`
          }
        />
      </div>

      {error ? (
        <div
          style={{
            padding: 10,
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20,
        }}
      >
        {loading ? (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p>
        ) : data && data.buckets.length > 0 ? (
          <EarningsChart buckets={data.buckets} />
        ) : (
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            No earnings in this range yet. Coin unlocks and subscription cuts show up here once
            readers pay.
          </p>
        )}
      </div>
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {label}
    </span>
    <strong style={{ fontSize: 20, fontWeight: 600 }}>{value}</strong>
  </div>
)

const pct = (n: number, d: number): string => (d === 0 ? '0%' : `${Math.round((n / d) * 100)}%`)

type ChartProps = { buckets: EarningsBucket[] }

const EarningsChart = ({ buckets }: ChartProps) => {
  const grouped = useMemo(() => {
    const map = new Map<string, { coin: number; sub: number }>()
    for (const b of buckets) {
      const e = map.get(b.bucket) ?? { coin: 0, sub: 0 }
      e[b.source] += b.author_cut_coins
      map.set(b.bucket, e)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [buckets])

  const maxTotal = useMemo(
    () => grouped.reduce((m, [, v]) => Math.max(m, v.coin + v.sub), 1),
    [grouped],
  )

  const W = 720
  const H = 200
  const PAD = { top: 10, right: 10, bottom: 24, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const barGap = 4
  const barW = Math.max(2, innerW / grouped.length - barGap)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H} role="img" aria-label="Earnings chart">
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="#e5e7eb"
        />
        {grouped.map(([bucket, v], i) => {
          const total = v.coin + v.sub
          const totalH = (total / maxTotal) * innerH
          const subH = (v.sub / maxTotal) * innerH
          const coinH = totalH - subH
          const x = PAD.left + i * (barW + barGap)
          const y = PAD.top + innerH - totalH
          return (
            <g key={bucket}>
              <rect x={x} y={y} width={barW} height={subH} fill="#6366f1" />
              <rect x={x} y={y + subH} width={barW} height={coinH} fill="#10b981" />
              {i % Math.max(1, Math.floor(grouped.length / 8)) === 0 ? (
                <text
                  x={x + barW / 2}
                  y={PAD.top + innerH + 14}
                  fontSize={10}
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {bucket.slice(5)}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        <Swatch color="#10b981" label="Coins" />
        <Swatch color="#6366f1" label="Subs" />
      </div>
    </div>
  )
}

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
    {label}
  </span>
)
