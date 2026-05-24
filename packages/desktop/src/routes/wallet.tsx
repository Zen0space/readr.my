import { useCallback, useEffect, useState } from 'react'
import { getWallet, type Wallet } from '../api/wallet'
import { listMyPayouts, requestPayout, type Payout, type PayoutStatus } from '../api/payouts'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Field } from '../components/Field'

const MIN_PAYOUT_COINS = 100

const statusVariant = (s: PayoutStatus): 'default' | 'success' | 'warning' | 'muted' => {
  if (s === 'paid') return 'success'
  if (s === 'approved') return 'default'
  if (s === 'rejected') return 'warning'
  return 'muted'
}

export const WalletRoute = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [payouts, setPayouts] = useState<Payout[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    try {
      const [w, p] = await Promise.all([getWallet(), listMyPayouts()])
      setWallet(w)
      setPayouts(p.items)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px 0' }}>Wallet</h1>

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
          padding: 18,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 4,
            }}
          >
            Coin balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            {wallet ? wallet.coin_balance.toLocaleString() : '…'}
          </div>
          {wallet ? (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              ≈ RM {(wallet.coin_balance / wallet.coins_per_rm).toFixed(2)}
            </div>
          ) : null}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Request payout'}
          </Button>
        </div>
      </div>

      {showForm ? (
        <PayoutForm
          maxCoins={wallet?.coin_balance ?? 0}
          coinsPerRm={wallet?.coins_per_rm ?? 10}
          onSubmitted={() => {
            setShowForm(false)
            void load()
          }}
        />
      ) : null}

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0' }}>Payout history</h2>

      {payouts === null ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>Loading…</p>
      ) : payouts.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>No payouts requested yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {payouts.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14 }}>
                  {p.amount_coins.toLocaleString()} coins · RM {(p.amount_rm_cents / 100).toFixed(2)}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  Requested {new Date(p.requested_at).toLocaleString()}
                </span>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
                {p.method_ref ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type FormProps = {
  maxCoins: number
  coinsPerRm: number
  onSubmitted: () => void
}

const PayoutForm = ({ maxCoins, coinsPerRm, onSubmitted }: FormProps) => {
  const [amountCoins, setAmountCoins] = useState<number>(Math.max(MIN_PAYOUT_COINS, 0))
  const [methodRef, setMethodRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await requestPayout({ amount_coins: amountCoins, method_ref: methodRef.trim() })
      onSubmitted()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const tooLow = amountCoins < MIN_PAYOUT_COINS
  const tooHigh = amountCoins > maxCoins

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Amount (coins)</span>
        <input
          type="number"
          min={MIN_PAYOUT_COINS}
          max={maxCoins}
          step={10}
          value={amountCoins}
          onChange={(e) => setAmountCoins(Number(e.target.value))}
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          ≈ RM {(amountCoins / coinsPerRm).toFixed(2)} · min {MIN_PAYOUT_COINS} coins · balance {maxCoins.toLocaleString()}
        </span>
      </label>

      <Field
        label="Bank / e-wallet reference"
        placeholder="Maybank — 1234XXXXXXX"
        value={methodRef}
        onChange={(e) => setMethodRef(e.target.value)}
        required
        maxLength={200}
      />

      {error ? (
        <div style={{ padding: 8, background: '#fef2f2', color: '#991b1b', borderRadius: 6, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          disabled={busy || tooLow || tooHigh || methodRef.trim().length === 0}
        >
          {busy ? 'Submitting…' : 'Submit request'}
        </Button>
      </div>
    </form>
  )
}
